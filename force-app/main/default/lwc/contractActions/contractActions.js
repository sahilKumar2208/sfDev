import { LightningElement, track, api } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import getLoggedInUserDetails from "@salesforce/apex/UtilsController.getLoggedInUserDetails";
import approveContract from "@salesforce/apex/ContractDetailsController.approveContract";

export default class ContractActions extends LightningElement {
  @api recordId;
  @track contractDetailsPresent = false;
  @track showApproveUI = false;
  @track userId;
  @track userName;
  @track contractId;
  @track cmtToken;
  @track isButtonDisabled = false;

  async connectedCallback() {
    const authToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxMzE3MDYwOCwiZXhwIjoxNzE0MjUwNjA4fQ.MzfWSuy3mhu7yTmiCijijOpPaT3SVZg3DPQSjPeQ_Dk";

    // Get CMT token
    let cmtToken = localStorage.getItem(`accessToken`);
    if (!cmtToken) {
      cmtToken = await getAccessToken({
        authServiceToken: authToken
      });
      console.log("cmt token here !!", cmtToken);

      // Store token in localStorage
      localStorage.setItem(`accessToken`, cmtToken);
      console.log("Access token stored in localStorage");
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
    const approvalResponse = await approveContract({
      contractId: this.contractId,
      accessToken: this.cmtToken
    });
    console.log("approval response", approvalResponse);
    console.log("Approve button clicked");
    this.isButtonDisabled = true;
  }
}
