import { LightningElement, track, api, wire } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";

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

  //https://playground-contracts.intellosync.com/contract/662367ce63b41c5a2f8fac48?tab=2
  async connectedCallback() {
    this.registerRefreshEventListener();

    const authToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxNTc3ODI1NSwiZXhwIjoxNzQ3MzM1ODU1fQ.n5mjllU-DbplgTSiQUsNBnMCXOUtHX-eeAudcr-rOoQ";

    // Get CMT token
    let cmtToken = localStorage.getItem(`accessToken`);
    if (!cmtToken) {
      const cmtTokenResponse = await getAccessToken({
        authServiceToken: authToken
      });
      console.log("cmt token here !!", cmtTokenResponse);

      if (cmtTokenResponse.statusCode === 200) {
        cmtToken = cmtTokenResponse.accessToken;
        // Store token in localStorage
        localStorage.setItem(`accessToken`, cmtTokenResponse.accessToken);
        console.log("Access token stored in localStorage");
      } else {
        // show unauthorized !!! OR authorization falied with the given mail message.
      }
    }

    this.cmtToken = cmtToken;
    console.log("reocrd id id of contract details", this.recordId);
    // get the contract id // by getting the record details through salesforce

    this.isLoading = true;
    await this.fetchContractRecord(this.recordId, cmtToken);
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
      });
  }

  // this will fetch contract record details present in salesforce
  async fetchContractRecord(recordId, accessToken) {
    try {
      const contractRecord = await getContractRecordDetails({
        recordId: recordId
      });
      console.log("contract record iss -->", contractRecord);
      await this.fetchContractDetails(
        contractRecord.Intellosync_workflow_id__c,
        accessToken
      );
    } catch (error) {
      console.log("error in fetching the contract record", error);
    }
  }

  async fetchContractDetails(contractId, accessToken) {
    const contractDetails = await getContractDetails({
      contractId: contractId,
      accessToken: accessToken
    });
    console.log("contract details from intello --->", contractDetails);

    this.contractId = contractDetails._id;

    this.iframeUrl = `http://localhost:5173/contract/${this.contractId}/activities`;
  }
}
