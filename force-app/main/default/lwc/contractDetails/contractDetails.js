import { LightningElement, track, api } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDetails from "@salesforce/apex/ContractDetailsController.getContractDetails";
import getWorkflowDetails from "@salesforce/apex/ContractDetailsController.getWorkflowDetails";
import retrieveCurrentUserAccountDetails from "@salesforce/apex/AccountDetailsController.retrieveCurrentUserAccountDetails";

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
  @track cmtToken;
  @track hasContractRecordError = false;
  @track hasError = false;

  async connectedCallback() {
    try {
      console.log("sahil !!!");
      const userDetails = await this.fetchUserDetails();
      const authToken = await this.fetchAuthToken(userDetails.Email);
      this.cmtToken = await this.retrieveCmtToken(authToken);
      console.log("Recordsahil ID sddcscs of contract details:", this.recordId);
      await this.fetchContractRecord(this.recordId, this.cmtToken);
      this.contractDetailsPresent = true;
    } catch (error) {
      console.error("An error occurred in connectedCallback:", error);
    }
  }

  async fetchUserDetails() {
    try {
      const userDetails = await retrieveCurrentUserAccountDetails();

      if (userDetails && userDetails.Email) {
        console.log("Current user's email:", userDetails.Email);
      } else {
        console.error("Email key is missing or empty in user details.");
        this.authError = true;
        this.hasError = true;
        console.log("1qwerty");
      }

      return userDetails;
    } catch (error) {
      console.error("An error occurred while fetching user details:", error);
      this.authError = true;
      this.hasError = true;
      console.log("2qwerty");
      throw error;
    }
  }

  async fetchAuthToken(email) {
    console.log("email of current user", email);
    // ***** HARD CODING THE AUTH TOKEN ********* //
    const authToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxNTc3ODI1NSwiZXhwIjoxNzQ3MzM1ODU1fQ.n5mjllU-DbplgTSiQUsNBnMCXOUtHX-eeAudcr-rOoQ";
    console.log("Auth token:", authToken);
    return authToken;
  }

  async retrieveCmtToken(authToken) {
    let cmtToken = localStorage.getItem("accessToken");

    if (!cmtToken) {
      try {
        const cmtTokenResponse = await getAccessToken({
          authServiceToken: authToken
        });

        if (cmtTokenResponse.statusCode === 200) {
          cmtToken = cmtTokenResponse.accessToken;
          localStorage.setItem("accessToken", cmtToken);
          console.log("Access token stored in localStorage");
        } else {
          console.error(
            "Authorization failed with status code:",
            cmtTokenResponse.statusCode
          );
          this.authError = true;
          this.hasError = true;
          console.log("3qwerty");
        }
      } catch (error) {
        console.error(
          "An error occurred while retrieving the CMT token:",
          error
        );
        this.authError = true;
        this.hasError = true;
        console.log("4qwerty");
      }
    }

    console.log("CMT token:", cmtToken);
    return cmtToken;
  }

  async fetchContractRecord(recordId, accessToken) {
    try {
      const contractRecord = await getContractRecordDetails({ recordId });
      console.log("Contract record qwerty:", contractRecord);
      await this.fetchContractDetails(
        contractRecord.Intellosync_workflow_id__c,
        accessToken
      );
    } catch (error) {
      console.error("Error in fetching the contract record:", error);
      this.hasError = true;
      console.log("5qwerty");
    }
  }

  async fetchContractDetails(contractId, accessToken) {
    try {
      const response = await getContractDetails({
        contractId,
        accessToken
      });

      console.log(" contract details response XYZ --->", response);

      if (response.statusCode === 200) {
        const contractDetails = response.body;
        console.log("Contract details from Intello qwerty:", contractDetails);

        const workflowId = contractDetails.workflowId._id;
        const workflowDataResponse = await this.fetchWorkflowData(
          workflowId,
          accessToken
        );

        console.log("workflow data response qwerty---->", workflowDataResponse);

        if (workflowDataResponse) {
          const workflowData = workflowDataResponse
          console.log("Workflow details qwerty :", workflowData);
          this.updateContractDetails(contractDetails, workflowData);
        } else {
          console.error(
            "Error in fetching workflow details:",
            workflowDataResponse
          );
          this.hasError = true;
          console.log("100qwerty");
        }
      } else {
        console.error("Error in fetching contract details:", response.body);
        this.hasError = true;
        console.log("6qwerty");
      }
    } catch (error) {
      console.error("Error in fetching contract details:", error);
      this.hasError = true;
      console.log("7qwerty");
    }
  }

  updateContractDetails(contractDetails, workflowData) {
    this.stage = contractDetails.stage;
    this.priority = contractDetails.priority;
    this.status = contractDetails.status;

    this.approvers = this.extractApprovers(workflowData?.approvalSteps);
    this.internalSignatories = this.extractSignatories(
      workflowData?.signingSteps
    );
    this.participants = workflowData?.participants.map(
      (person) => person.fullName
    );
  }

  extractApprovers(approvalSteps) {
    const approvers = {};
    approvalSteps.forEach((step) => {
      const approvalOrder = step.approvalOrder;
      const fullNames = step.members.map((member) => member.fullName);

      if (approvers[approvalOrder]) {
        approvers[approvalOrder].fullNames.push(...fullNames);
      } else {
        approvers[approvalOrder] = {
          approverLevel: approvalOrder,
          fullNames
        };
      }
    });
    return Object.values(approvers);
  }

  extractSignatories(signingSteps) {
    const internalSignatories = {};
    signingSteps.forEach((step) => {
      const signingOrder = step.signingOrder;
      const fullNames = step.members.map((member) => member.fullName);

      if (internalSignatories[signingOrder]) {
        internalSignatories[signingOrder].fullNames.push(...fullNames);
      } else {
        internalSignatories[signingOrder] = {
          signerLevel: signingOrder,
          fullNames
        };
      }
    });
    return Object.values(internalSignatories);
  }

  async fetchWorkflowData(workflowId, accessToken) {
    try {
      const response = await getWorkflowDetails({
        workflowId,
        accessToken
      });

      if (response.statusCode === 200) {
        const workflowData = response.body;
        return workflowData;
      }
      //ELSE
      else {
        console.error("Error in fetching workflow data:", response.body);
        this.hasError = true;
        console.log("8qwerty");
        throw new Error(`Error in fetching workflow data: ${response.body}`);
      }
    } catch (error) {
      console.error("Error in fetching workflow data:", error);
      this.hasError = true;
      console.log("9qwerty");
      throw error;
    }
  }
}
