import { LightningElement, track, api} from 'lwc';
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";

export default class ContractActivities extends LightningElement {
  @track isLoading;
  @track iframeUrl;
  @track contractId;
  @api recordId

  //https://playground-contracts.intellosync.com/contract/662367ce63b41c5a2f8fac48?tab=2
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
    console.log("reocrd id id of contract details", this.recordId);
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

    this.iframeUrl = `http://localhost:5173/contract/${this.contractId}/activities`;
  }
}