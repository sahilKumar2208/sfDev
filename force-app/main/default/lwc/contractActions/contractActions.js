import { LightningElement, track, api, wire } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import getLoggedInUserDetails from "@salesforce/apex/UtilsController.getLoggedInUserDetails";
import approveContract from "@salesforce/apex/ContractDetailsController.approveContract";

// Refresh related code
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
    console.log("reocrdssc id of contract details", this.recordId);
    // get the contract id // by getting the record details through salesforce
    await this.fetchContractRecord(this.recordId, cmtToken);

    this.contractDetailsPresent = true;
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

    // check the approvers array and match the current user's userId is present or not
    const user = await getLoggedInUserDetails({ accessToken: accessToken });
    console.log("userId mila ?", user.userId);
    this.userId = user.userId;
    this.userName = user.fullName;

    const approversArray = contractDetails.approvers;

    const userIdWithoutQuotes = this.userId.replace(/"/g, "");

    console.log("userId without quotes", userIdWithoutQuotes);

    const showApproveUI = await this.findAndCheckUserEntry(
      approversArray,
      userIdWithoutQuotes
    );

    this.showApproveUI = showApproveUI;

    console.log("show approve ui --->", this.showApproveUI);

    //Now check if approval is required or not
  }

  findAndCheckUserEntry(data, userId) {
    const userEntry = this.findUserEntry(data, userId);
    if (!userEntry) {
      return null; // User not found
    }

    // Check if the user entry matches any other entry based on requestId, approvalOrder, and status === Approved
    const matchingEntries = data.filter(
      (entry) =>
        entry.requestId === userEntry.requestId &&
        entry.approvalOrder === userEntry.approvalOrder &&
        entry.status === "Approved" &&
        entry.id !== userEntry.Id // Exclude the user entry itself
    );

    if (matchingEntries.length === 0) {
      return true; //show approve button
    }
    return false; //dont show approve button
  }

  findUserEntry(data, userId) {
    for (let entry of data) {
      console.log("entryId --->", entry.id);
      console.log("userId", userId);
      if (entry.id === userId) {
        return entry;
      }
    }
    return null;
  }

  async handleApprove() {
    console.log("cmt token ", this.cmtToken);
    console.log("contractId ", this.contractId);

    try {
      const approvalResponse = await approveContract({
        contractId: this.contractId,
        accessToken: this.cmtToken
      });
      console.log("approval response body", approvalResponse.body);

      console.log("approval response isss -->", approvalResponse);

      if (approvalResponse.statusCode === 200) {
        this.isButtonDisabled = true;
        this.showSuccessMessage = true;
        this.errorMessage = null;

        // Fire the refresh event
        fireEvent(this.pageRef, "refreshEvent", {
          /* optional data */
        });
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
