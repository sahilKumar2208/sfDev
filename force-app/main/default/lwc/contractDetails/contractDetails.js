import { LightningElement, track, api } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import getWorkflowDetails from "@salesforce/apex/ContractDetailsController.getWorkflowDetails";

export default class ContractDetails extends LightningElement {
  @api recordId;
  @track contractAge;
  @track status;
  @track stage;
  @track priority;
  @track approvers;
  @track internalSignatories;
  @track contractDetailsPresent = false;
  @track participants;

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
    console.log("reocrd id of contract details", this.recordId);
    // get the contract id // by getting the record details through salesforce
    await this.fetchContractRecord(this.recordId, cmtToken);

    this.contractDetailsPresent = true;

    // call the function to get the contract details
    // this will need the contract id
    // this.fetchContractDetails();
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

  // this will fetch contract details from intello
  async fetchContractDetails(contractId, accessToken) {
    const contractDetails = await getContractDetails({
      contractId: contractId,
      accessToken: accessToken
    });
    console.log("contract details from intello --->", contractDetails);

    const workflowId = contractDetails.workflowId._id;

    //function call to get the approvers, signatories, participants
    const workflowData = await this.fetchWorkflowData(workflowId, accessToken);
    console.log("workflow detailsssss --->", workflowData);

    this.stage = contractDetails.stage;
    this.priority = contractDetails.priority;
    this.status = contractDetails.status;

    //approvers ----START
    let approvers = {};

    // Group entries by approvalOrder
    workflowData?.approvalSteps.forEach((step) => {
      const approvalOrder = step.approvalOrder;
      console.log("approval order ---->", approvalOrder);

      const fullNames = step.members.map((member) => member.fullName);

      //checking if approver with the same approver level alrerady exist in the approver object
      if (approvalOrder in approvers) {
        approvers[approvalOrder].fullNames.push(...fullNames);
      } else {
        approvers[approvalOrder] = {
          approverLevel: approvalOrder,
          fullNames: fullNames
        };
      }
    });

    //converting to array as lwc doesnot support iteration over map
    const approversArray = Object.values(approvers);

    console.log("approvers are ----->", JSON.stringify(approversArray));

    this.approvers = approversArray;

    // APPROVER ----END



   //signatories ( internal + external ) --- START

    let internalSignatories = {};

    workflowData?.signingSteps.forEach((step) => {
      const signingOrder = step.signingOrder;
      console.log("signing order ---->", signingOrder);

      const signerName = step.members.map((member) => member.fullName);
      console.log("signerName --->", signerName);

      // Check if signatory with the same signerLevel already exists in the signatories object
      if (signingOrder in internalSignatories) {
        // If exists, update its fullname
        internalSignatories[signingOrder].fullNames.push(...signerName);
      } else {
        // If not exists, create a new entry
        internalSignatories[signingOrder] = {
          signerLevel: signingOrder,
          fullNames: signerName
        };
      }
    });

    //converting to array as lwc doesnot support iteration over map

    const internalSignatoriesArray = Object.values(internalSignatories);

    console.log(
      "signatories areee --->",
      JSON.stringify(internalSignatoriesArray)
    );

    this.internalSignatories = internalSignatoriesArray;

    // ...INTERNAL SIGNATORIES END

    //TODO: EXTERNAL SIGNATORIES

    //participants ( internal )
    const participantNames = workflowData?.participants.map((person) => person.fullName)
    console.log("participants are ---->", JSON.stringify(participantNames));

    this.participants = participantNames;

  }

  async fetchWorkflowData(workflowId, accessToken) {
    console.log("wf ID --->", workflowId);
    console.log("access tok -->", accessToken);
    const workflowData = await getWorkflowDetails({
      workflowId: workflowId,
      accessToken: accessToken
    });
    // console.log("workflow details are -->", workflowData);
    return workflowData;
  }
}
