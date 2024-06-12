import { LightningElement, track, api, wire } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import getExpiryTime from "@salesforce/apex/JwtDecoder.getExpiryTime";
import { registerListener, unregisterAllListeners } from "c/pubsub";
import { CurrentPageReference } from "lightning/navigation";

export default class LogicLwc extends LightningElement {
  // @wire(CurrentPageReference) pageRef;
  // @api recordId;
  // @track isLoading = false;
  // @track approvers = [];
  // @track cmtToken;
  // @track showApprovers = false;
  // @track hasError = false;
  // @track authError = false;
  // @track contractId;

  // async connectedCallback() {
  //   this.registerRefreshEventListener();

  //   try {
  //     this.isLoading = true;
  //     const authToken = this.getAuthToken();
  //     this.cmtToken = await this.retrieveCmtToken(authToken);

  //     console.log("Reccc of contract details mnopq :", this.recordId);

  //     const contractDetails = await this.fetchContractRecord(
  //       "a0CIR000026bLpj2AE",
  //       this.cmtToken
  //     );
  //     console.log("sahil mnop---->", contractDetails);
  //     this.handleContractStage(contractDetails);
  //   } catch (error) {
  //     this.handleError("Error in connectedCallback", error);
  //   } finally {
  //     this.isLoading = false;
  //   }
  // }

  // async fetchContractRecord(recordId, accessToken) {
  //   try {
  //     const contractRecord = await getContractRecordDetails({ recordId });
  //     console.log("Contract record:", contractRecord);
  //     this.contractId = contractRecord.Intellosync_workflow_id__c;
  //     const contractDetails = await this.fetchContractDetails(
  //       contractRecord.Intellosync_workflow_id__c,
  //       accessToken
  //     );
  //     return contractDetails;
  //   } catch (error) {
  //     this.handleError("Error fetching the contract record", error);
  //   }
  // }

  // async handleContractStage(contractDetails) {
  //   const currentStage = contractDetails.stage;
  //   console.log("Current stage:", currentStage);

  //   switch (currentStage) {
  //     case "Draft":
  //     case "Review":
  //     case "Negotiation":
  //       this.showInitialStageDetails(contractDetails);
  //       break;
  //     case "Approval":
  //       console.log("This is approval Stage!!");
  //       this.showApproverStageDetailsUI(contractDetails);
  //       break;
  //     case "Esign":
  //       this.showEsignStageDetails(contractDetails);
  //       break;
  //     default:
  //       console.log("Unknown stage:", currentStage);
  //   }
  // }

  // showApproverStageDetailsUI(contractDetails) {
  //   const approvers = contractDetails.approvers;
  //   const approvalStepsArray = contractDetails.workflowId.approvalSteps;

  //   const approversWithFullName = approvers.map((approver) => {
  //     let fullName = "";

  //     for (const step of approvalStepsArray) {
  //       const member = step.members.find(
  //         (member) => member._id === approver.id
  //       );
  //       if (member) {
  //         fullName = member.fullName;
  //         break;
  //       }
  //     }

  //     return {
  //       ...approver,
  //       fullName
  //     };
  //   });

  //   const newArr = this.filterApprovedRequests(approversWithFullName);

  //   console.log("new Array king !!", JSON.stringify(newArr));

  //   this.approvers = [];

  //   this.showApprovers = true;
  // }

  // async fetchContractDetails(contractId, accessToken) {
  //   try {
  //     const response = await getContractDetails({ contractId, accessToken });

  //     console.log("Contract details response:", response);

  //     if (response.statusCode === 200) {
  //       const contractDetails = response.body;
  //       console.log("Contract details from Intello:", contractDetails);
  //       this.contractId = response.body._id;
  //       return contractDetails;
  //     } else {
  //       this.handleError("Error in fetching contract details", response.body);
  //     }
  //   } catch (error) {
  //     this.handleError("Error in fetching contract details", error);
  //   }
  // }

  // handleError(message, error) {
  //   console.error(message, error);
  //   this.hasError = true;
  //   this.isLoading = false;
  // }

  // getAuthToken() {
  //   return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxNTc3ODI1NSwiZXhwIjoxNzQ3MzM1ODU1fQ.n5mjllU-DbplgTSiQUsNBnMCXOUtHX-eeAudcr-rOoQ";
  // }

  // async retrieveCmtToken(authToken) {
  //   let cmtToken = localStorage.getItem("accessToken");

  //   let expTime;

  //   if (cmtToken) {
  //     expTime = await getExpiryTime({ jwtToken: cmtToken });
  //   }

  //   const currTime = Date.now();

  //   const hasExpired = currTime > expTime;

  //   if (!cmtToken || hasExpired) {
  //     const cmtTokenResponse = await getAccessToken({
  //       authServiceToken: authToken
  //     });
  //     console.log("CMT token response:", cmtTokenResponse);

  //     if (cmtTokenResponse.statusCode === 200) {
  //       cmtToken = cmtTokenResponse.accessToken;
  //       localStorage.setItem("accessToken", cmtToken);
  //       console.log("Access token stored in localStorage");
  //     } else {
  //       console.error("Authorization failed with the given mail.");
  //       this.authError = true;
  //       this.hasError = true;
  //     }
  //   }
  //   return cmtToken;
  // }

  // registerRefreshEventListener() {
  //   registerListener("refreshEvent", this.handleRefresh, this);
  // }

  // disconnectedCallback() {
  //   unregisterAllListeners(this);
  // }

  // filterApprovedRequests(inputArray) {
  //   console.log("Filtering approved requests");
  //   const approvedRequests = new Set();
  //   const filteredArray = [];

  //   for (const entry of inputArray) {
  //     const { requestId, status } = entry;

  //     if (status === "Approved") {
  //       approvedRequests.add(requestId);
  //       filteredArray.push(entry);
  //     } else if (!approvedRequests.has(requestId)) {
  //       entry.status = "Pending";
  //       filteredArray.push(entry);
  //     }
  //   }

  //   return filteredArray;
  // }

  // // handleRefresh() {
  // //   this.isLoading = true;
  // //   this.approvers = [
  // //     {
  // //       id: "65e7ebd929caab7e4c88c23e",
  // //       approvalOrder: 0,
  // //       status: "Set",
  // //       requestId: "6665ef8a810bc6f9e43c443d",
  // //       _id: "6665ef8a810bc6f9e43c4441",
  // //       fullName: "Tushar Sharma"
  // //     }
  // //   ];
  // //   this.isLoading = false;
  // // }

  // async handleRefresh() {
  //   this.isLoading = true; // Show the loading spinner
  //   const contractDetails = await this.fetchContractDetails(
  //     this.contractId,
  //     this.cmtToken
  //   );

  //   console.log("kign contract details -->", contractDetails);
    
  //   this.updateContractDetailsUI(contractDetails);
  //   this.isLoading = false;
  // }

  // updateContractDetailsUI(contractDetails) {
  //   const currentStage = contractDetails.stage;

  //   console.log("king !!", currentStage);
  //   this.showInitialDetails = false;
  //   this.showApprovers = false;
  //   this.showEsigners = false;

  //   if (
  //     currentStage === "Draft" ||
  //     currentStage === "Review" ||
  //     currentStage === "Negotiation"
  //   ) {
  //     this.showInitialStageDetailsUI(contractDetails);
  //   } else if (currentStage === "Approval") {
  //     console.log("king apprrr!!");
  //     this.showApproverStageDetailsUI(contractDetails);
  //   } else if (currentStage === "Esign") {
  //     this.showEsignStageDetailsUI(contractDetails);
  //   }
  // }
}
