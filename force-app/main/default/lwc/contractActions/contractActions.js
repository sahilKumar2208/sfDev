import { LightningElement, track, api, wire } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import getLoggedInUserDetails from "@salesforce/apex/UtilsController.getLoggedInUserDetails";
import approveContract from "@salesforce/apex/ContractDetailsController.approveContract";

import { fireEvent } from "c/pubsub";
import { CurrentPageReference } from "lightning/navigation";

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
    if (!cmtToken) {
      const cmtTokenResponse = await getAccessToken({
        authServiceToken: authToken
      });
      if (cmtTokenResponse.statusCode === 200) {
        cmtToken = cmtTokenResponse.accessToken;
        localStorage.setItem("accessToken", cmtToken);
        console.log("Access token stored in localStorage");
      } else {
        throw new Error("Authorization failed");
      }
    }
    return cmtToken;
  }

  async fetchContractRecord(recordId, accessToken) {
    try {
      const contractRecord = await getContractRecordDetails({ recordId });
      await this.fetchContractDetails(
        contractRecord.Intellosync_workflow_id__c,
        accessToken
      );
    } catch (error) {
      console.error("Error in fetching the contract record:", error);
    }
  }

  async fetchContractDetails(contractId, accessToken) {
    try {
      const contractDetails = await getContractDetails({
        contractId,
        accessToken
      });
      this.contractId = contractDetails._id;

      const user = await getLoggedInUserDetails({ accessToken });
      this.userId = user.userId;
      this.userName = user.fullName;

      const userIdWithoutQuotes = this.userId.replace(/"/g, "");
      this.showApproveUI = this.isApprovalRequired(
        contractDetails.approvers,
        userIdWithoutQuotes
      );
    } catch (error) {
      console.error("Error in fetching the contract details:", error);
    }
  }

  isApprovalRequired(approversArray, userId) {
    const userEntry = this.findUserEntry(approversArray, userId);
    if (!userEntry) {
      return false; // User not found
    }

    const matchingEntries = approversArray.filter(
      (entry) =>
        entry.requestId === userEntry.requestId &&
        entry.approvalOrder === userEntry.approvalOrder &&
        entry.status === "Approved" &&
        entry.id !== userEntry.id
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
