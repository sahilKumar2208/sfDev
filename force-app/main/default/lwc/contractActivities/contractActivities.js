import { LightningElement, track, api, wire } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import getExpiryTime from "@salesforce/apex/JwtDecoder.getExpiryTime";

// refresh related
import { registerListener, unregisterAllListeners } from "c/pubsub";
import { CurrentPageReference } from "lightning/navigation";

export default class ContractActivities extends LightningElement {
  @wire(CurrentPageReference) pageRef;
  @track isLoading;
  @track iframeUrl;
  @track contractId;
  @api recordId;
  cmtToken;
  @track hasError;
  @track authError;

  async connectedCallback() {
    this.registerRefreshEventListener();

    const authToken = this.getAuthToken();
    this.cmtToken = await this.retrieveCmtToken(authToken);

    console.log("Record ID of contract details:", this.recordId);

    this.isLoading = true;
    await this.fetchContractRecord(this.recordId, this.cmtToken);
    this.isLoading = false;
  }

  registerRefreshEventListener() {
    registerListener("refreshEvent", this.handleRefresh, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  handleRefresh() {
    this.isLoading = true; // Show the loading spinner
    this.fetchContractDetails(this.contractId, this.cmtToken)
      .then(() => {
        this.isLoading = false; // Hide the loading spinner
      })
      .catch((error) => {
        console.error("Error refreshing component:", error);
        this.isLoading = false; // Hide the loading spinner
        this.hasError = true;
      });
  }

  async fetchContractRecord(recordId, accessToken) {
    try {
      const contractRecord = await getContractRecordDetails({ recordId });
      console.log("Contract record:", contractRecord);
      await this.fetchContractDetails(
        contractRecord.Intellosync_workflow_id__c,
        accessToken
      );
    } catch (error) {
      console.log("Error fetching the contract record:", error);
      this.hasError = true;
    }
  }

  async fetchContractDetails(contractId, accessToken) {
    try {
      const contractDetailsResponse = await getContractDetails({
        contractId,
        accessToken
      });
      console.log(
        "Contract details from Intello TRP:",
        contractDetailsResponse
      );

      if (contractDetailsResponse.statusCode === 200) {
        this.contractId = contractDetailsResponse.body._id;
        this.iframeUrl = `http://localhost:5173/contract/${this.contractId}/activities`;
      } else {
        this.hasError = true;
      }
    } catch (error) {
      console.log("Error fetching contract details:", error);
      this.hasError = true;
    }
  }

  getAuthToken() {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxNTc3ODI1NSwiZXhwIjoxNzQ3MzM1ODU1fQ.n5mjllU-DbplgTSiQUsNBnMCXOUtHX-eeAudcr-rOoQ";
  }

  async retrieveCmtToken(authToken) {
    let cmtToken = localStorage.getItem("accessToken");

    const expTime = await getExpiryTime({ jwtToken: cmtToken });

    const currTime = Date.now();

    const hasExpired = currTime - expTime > 0 ? true : false;

    if (!cmtToken || hasExpired) {
      const cmtTokenResponse = await getAccessToken({
        authServiceToken: authToken
      });
      console.log("CMT token response:", cmtTokenResponse);

      if (cmtTokenResponse.statusCode === 200) {
        cmtToken = cmtTokenResponse.accessToken;
        localStorage.setItem("accessToken", cmtToken);
        console.log("Access token stored in localStorage");
      } else {
        console.error("Authorization failed with the given mail.");
        this.authError = true;
        this.hasError = true;
      }
    }
    return cmtToken;
  }
}
