import { LightningElement, track, api, wire } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import { registerListener, unregisterAllListeners } from "c/pubsub";

import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import retrieveCurrentUserAccountDetails from "@salesforce/apex/AccountDetailsController.retrieveCurrentUserAccountDetails";
import getExpiryTime from "@salesforce/apex/JwtDecoder.getExpiryTime";
import COMPANY_LOGO_URL from "@salesforce/resourceUrl/company_logo";

// Constants
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsb3N5bmMuY29tIiwiaWF0IjoxNzE1Nzc4MjU1LCJleHAiOjE3NDczMzU4NTV9.n5mjllU-DbplgTSiQUsNBnMCXOUtHX-eeAudcr-rOoQ";

// Utility Functions
function handleError(message, error) {
  console.error(message, error);
  this.hasError = true;
}

function filterApprovedRequests(inputArray) {
  const approvedRequests = new Set();
  const filteredArray = [];

  for (const entry of inputArray) {
    const { requestId, status } = entry;

    if (status === "Approved") {
      approvedRequests.add(requestId);
      filteredArray.push(entry);
    } else if (!approvedRequests.has(requestId)) {
      entry.status = "Pending";
      filteredArray.push(entry);
    }
  }

  return filteredArray;
}

// Service Class
class ContractService {
  static async fetchUserDetails() {
    try {
      const userDetails = await retrieveCurrentUserAccountDetails();
      if (userDetails?.Email) {
        console.log("Current user's email:", userDetails.Email);
      } else {
        console.error("Email key is missing or empty in user details.");
        throw new Error("Email key is missing or empty in user details.");
      }
      return userDetails;
    } catch (error) {
      handleError("An error occurred while fetching user details", error);
      throw error;
    }
  }

  static async fetchAuthToken(email) {
    console.log("Email of current user:", email);
    console.log("Auth token:", AUTH_TOKEN);
    return AUTH_TOKEN;
  }

  static async retrieveCmtToken(authToken) {
    let cmtToken = localStorage.getItem("accessToken");
    let expTime;

    if (cmtToken) {
      expTime = await getExpiryTime({ jwtToken: cmtToken });
    }

    const currTime = Date.now();

    const hasExpired = currTime - expTime > 0 ? true : false;

    if (!cmtToken || (cmtToken && hasExpired)) {
      try {
        const cmtTokenResponse = await getAccessToken({
          authServiceToken: authToken
        });
        if (cmtTokenResponse.statusCode === 200) {
          cmtToken = cmtTokenResponse.accessToken;
          localStorage.setItem("accessToken", cmtToken);
          console.log("Access token stored in localStorage");
        } else {
          handleError(
            "Authorization failed with status code:",
            cmtTokenResponse.statusCode
          );
        }
      } catch (error) {
        handleError("An error occurred while retrieving the CMT token", error);
      }
    }
    return cmtToken;
  }

  static async fetchContractRecord(recordId) {
    try {
      const contractRecord = await getContractRecordDetails({ recordId });
      console.log("Contract record:", contractRecord);
      return contractRecord;
    } catch (error) {
      handleError("Error in fetching the contract record", error);
      throw error;
    }
  }

  static async fetchContractDetails(contractId, accessToken) {
    try {
      const response = await getContractDetails({ contractId, accessToken });
      if (response.statusCode === 200) {
        console.log("Contract details from Intello:", response.body);
        return response.body;
      } else {
        handleError("Error in fetching contract details", response.body);
        throw new Error("Error in fetching contract details");
      }
    } catch (error) {
      handleError("Error in fetching contract details", error);
      throw error;
    }
  }
}

// Component Class
export default class ContractDetails extends LightningElement {
  @wire(CurrentPageReference) pageRef;
  @track isLoading = false;
  @track compayLogoUrl;
  @api recordId;
  @track contractAge;
  @track status;
  @track stage;
  @track priority;
  @track contractDetailsPresent = false;
  @track cmtToken;
  @track hasContractRecordError = false;
  @track hasError = false;
  @track contractId;
  @track approvers = [];
  @track internalSignatories = [];
  @track externalSignatories = [];
  @track participants = [];

  @track showInitialDetails = false;
  @track showApprovers = false;
  @track showEsigners = false;

  connectedCallback() {
    registerListener("refreshSecondComponent", this.handleRefresh, this);
    this.initializeComponent();
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  async initializeComponent() {
    try {
      this.compayLogoUrl = COMPANY_LOGO_URL;
      console.log("logo url --->", this.compayLogoUrl);
      this.isLoading = true;
      const userDetails = await ContractService.fetchUserDetails();
      const authToken = await ContractService.fetchAuthToken(userDetails.Email);
      this.cmtToken = await ContractService.retrieveCmtToken(authToken);
      const contractRecord = await ContractService.fetchContractRecord(
        this.recordId
      );
      // assign contractId variable its value
      this.contractId = contractRecord.Intellosync_workflow_id__c;
      const contractDetails = await ContractService.fetchContractDetails(
        contractRecord.Intellosync_workflow_id__c,
        this.cmtToken
      );

      console.log("reached eded", contractDetails);
      await this.updateContractDetailsUI(contractDetails);
      this.contractDetailsPresent = true;
    } catch (error) {
      this.handleError("An error occurred in initializeComponent", error);
    } finally {
      this.isLoading = false;
    }
  }

  async handleRefresh() {
    this.isLoading = true;
    try {
      const contractDetails = await ContractService.fetchContractDetails(
        this.contractId,
        this.cmtToken
      );
      console.log("fetched updated contract details --->", contractDetails);
      this.updateContractDetailsUI(contractDetails);
    } catch (error) {
      this.handleError("Error refreshing component", error);
    } finally {
      this.isLoading = false;
    }
  }

  updateContractDetailsUI(contractDetails) {
    const currentStage = contractDetails.stage;

    this.showInitialDetails = false;
    this.showApprovers = false;
    this.showEsigners = false;

    //set status, priority and stage
    this.status = contractDetails.status;
    this.priority = contractDetails.priority;
    this.stage = contractDetails.stage;

    switch (currentStage) {
      case "Draft":
      case "Review":
      case "Negotiation":
        this.showInitialStageDetailsUI(contractDetails);
        break;
      case "Approval":
        this.showApproverStageDetailsUI(contractDetails);
        break;
      case "Esign":
        this.showEsignStageDetailsUI(contractDetails);
        break;
      default:
        console.log("Unknown stage:", currentStage);
    }
  }

  showInitialStageDetailsUI(contractDetails) {
    const allParticipantsArray = [
      ...contractDetails.participants,
      ...contractDetails.externalParticipants
    ];
    this.participants = allParticipantsArray.map((person) => person.fullName);
    this.showInitialDetails = true;
  }

  showApproverStageDetailsUI(contractDetails) {
    const approvers = contractDetails.approvers;
    const approvalStepsArray = contractDetails.workflowId.approvalSteps;

    const approversWithFullName = approvers.map((approver) => {
      let fullName = "";

      for (const step of approvalStepsArray) {
        const member = step.members.find(
          (member) => member._id === approver.id
        );
        if (member) {
          fullName = member.fullName;
          break;
        }
      }

      return {
        ...approver,
        fullName
      };
    });

    const newArr = [...filterApprovedRequests(approversWithFullName)];

    console.log("ededededed", JSON.stringify(newArr));

    this.approvers = newArr;
    this.showApprovers = true;
  }

  showEsignStageDetailsUI(contractDetails) {
    const internalSignatories = [...contractDetails.signatories];
    const externalSignatories = [...contractDetails.externalSignatories];

    this.internalSignatories = internalSignatories.map((signatory) => {
      const { id, signingOrder, status } = signatory;
      const { _id, fullName, email } = id;
      return { id: _id, fullName, signingOrder, status };
    });

    this.externalSignatories = externalSignatories.map((signatory) => {
      const { id, signingOrder, status } = signatory;
      const { _id, fullName, email } = id;
      return { id: _id, fullName, signingOrder, status };
    });

    this.showEsigners = true;
  }

  handleError(message, error) {
    handleError(message, error);
    this.isLoading = false;
    this.hasError = true;
  }
}
