import { LightningElement, track, api, wire } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import getLoggedInUserDetails from "@salesforce/apex/UtilsController.getLoggedInUserDetails";
import approveContract from "@salesforce/apex/ContractDetailsController.approveContract";
import getExpiryTime from "@salesforce/apex/JwtDecoder.getExpiryTime";

import { fireEvent } from "c/pubsub";
import { CurrentPageReference } from "lightning/navigation";

// getAccessToken ---> DONE
// getContractRecordDetails
// getContractDetails
// getLoggedInUserDetails
// approveContract

export default class ContractActions extends LightningElement {
  @wire(CurrentPageReference) pageRef;

  @api recordId;
  @track contractDetailsPresent = false;
  @track showApproveUI = false;
  @track userId;
  @track userName;
  @track contractId;
  @track cmtToken;
  @track isButtonDisabled = false;
  @track showSuccessMessage = false;
  @track showErrorMessage = false;
  @track authError = false;
  @track hasError = false;

  async connectedCallback() {
    try {
      const authToken = this.getAuthToken();
      this.cmtToken = await this.getCmtToken(authToken);

      await this.fetchContractRecord(this.recordId, this.cmtToken);
      this.contractDetailsPresent = true;
    } catch (error) {
      console.error("Error in connectedCallback:", error);
    }
  }

  getAuthToken() {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxNTc3ODI1NSwiZXhwIjoxNzQ3MzM1ODU1fQ.n5mjllU-DbplgTSiQUsNBnMCXOUtHX-eeAudcr-rOoQ";
  }

  async getCmtToken(authToken) {
    let cmtToken = localStorage.getItem("accessToken");

    const expTime = await getExpiryTime({ jwtToken : cmtToken});

    const currTime = Date.now();

    const hasExpired = currTime - expTime > 0 ? true : false;

    if (!cmtToken || hasExpired) {
      const cmtTokenResponse = await getAccessToken({
        authServiceToken: authToken
      });
      if (cmtTokenResponse.statusCode === 200) {
        cmtToken = cmtTokenResponse.accessToken;
        localStorage.setItem("accessToken", cmtToken);
        console.log("Access token stored in localStorage");
      } else {
        this.authError = true;
        this.hasError = true;
        throw new Error("Authorization failed");
      }
    }
    return cmtToken;
  }

  async fetchContractRecord(recordId, accessToken) {
    try {
      const contractRecord = await getContractRecordDetails({ recordId });
      console.log("contract record details are wic--->", contractRecord);

      await this.fetchContractDetails(
        contractRecord.Intellosync_workflow_id__c,
        accessToken
      );
    } catch (error) {
      console.error("Error in fetching the contract record: wic", error);
    }
  }

  async fetchContractDetails(contractId, accessToken) {
    try {
      const contractDetailsResponse = await getContractDetails({
        contractId,
        accessToken
      });
      console.log("contract details response  wic--->", contractDetailsResponse);
      if (contractDetailsResponse.statusCode === 200) {
        this.contractId = contractDetailsResponse.body._id;

        const userResponse = await getLoggedInUserDetails({ accessToken });

        console.log("userResonse wic", userResponse);

        if (userResponse.statusCode === 200) {
          this.userId = userResponse.userDetails.userId;
          this.userName = userResponse.userDetails.fullName;

          const userIdWithoutQuotes = this.userId.replace(/"/g, "");
          this.showApproveUI = this.isApprovalRequired(
            contractDetailsResponse.body.approvers,
            userIdWithoutQuotes
          );
          console.log("approver req? wic", this.showApproveUI);
        }else{
          this.hasError = true;
        }
      } else {
        this.hasError = true;
      }
    } catch (error) {
      console.error("Error in fetching the contract details: wic", error);
      this.hasError = true;
    }
  }

  isApprovalRequired(approversArray, userId) {
    const userEntry = this.findUserEntry(approversArray, userId);
    console.log("userEntry wic", userEntry);
    if (!userEntry) {
      return false; // User not found
    }
    // condition to find if any other entry is present in approver array which have already approved the contract
    const matchingEntries = approversArray.filter(
      (entry) =>
        entry.requestId === userEntry.requestId &&
        entry.approvalOrder === userEntry.approvalOrder &&
        entry.status === "Approved" &&
        entry.id !== `"${userEntry.id}"`
    );

    return matchingEntries.length === 0;
  }

  findUserEntry(data, userId) {
    return data.find((entry) => entry.id === userId) || null;
  }

  async handleApprove() {
    try {
      const approvalResponse = await approveContract({
        contractId: this.contractId,
        accessToken: this.cmtToken
      });

      if (approvalResponse.statusCode === 200) {
        this.isButtonDisabled = true;
        this.showSuccessMessage = true;
        fireEvent(this.pageRef, "refreshEvent", {});
      } else {
        this.showErrorMessage = true;
        this.errorMessage = `Error: ${approvalResponse.body}`;
      }
    } catch (error) {
      this.showErrorMessage = true;
      this.errorMessage = `Exception: ${error.body.message}`;
    }
  }
}
