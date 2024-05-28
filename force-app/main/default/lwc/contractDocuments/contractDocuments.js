import { LightningElement, track, api } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDocumentsDetails from "@salesforce/apex/ContractDetailsController.getContractDocumentsDetails";
import downloadDocument from "@salesforce/apex/ContractDetailsController.downloadDocument";
import retrieveCurrentUserAccountDetails from "@salesforce/apex/AccountDetailsController.retrieveCurrentUserAccountDetails";

import { NavigationMixin } from "lightning/navigation";

export default class ContractDocuments extends NavigationMixin(
  LightningElement
) {
  @track isLoading;
  @track isContractDetailsPresent = false;
  @track contractId;
  @api recordId;
  @track documentDetails;
  @track cmtToken;
  @track storageDocumentId;

  @track authError = false;
  @track hasError = false;
  @track hasContractRecordError = false;

  // getAccessToken; ---> DONE
  // getContractRecordDetails
  // getContractDocumentsDetails
  // downloadDocument

  async connectedCallback() {
    const userDetails = await this.fetchUserDetails();
    const authToken = await this.fetchAuthToken(userDetails.Email);
    this.cmtToken = await this.retrieveCmtToken(authToken);

    if (this.cmtToken) {
      await this.loadContractDetails();
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
      }

      return userDetails;
    } catch (error) {
      console.error("An error occurred while fetching user details:", error);
      this.authError = true;
      this.hasError = true;
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
        }
      } catch (error) {
        console.error(
          "An error occurred while retrieving the CMT token:",
          error
        );
        this.authError = true;
        this.hasError = true;
      }
    }

    console.log("CMT token:", cmtToken);
    return cmtToken;
  }

  async loadContractDetails() {
    this.isLoading = true;
    try {
      const contractRecord = await this.fetchContractRecord(
        this.recordId,
        this.cmtToken
      );
      console.log("contract record --->", contractRecord);

      this.contractId = contractRecord.Intellosync_workflow_id__c;
      await this.fetchDocumentDetails(
        contractRecord.Intellosync_workflow_id__c,
        this.cmtToken
      );
      this.isContractDetailsPresent = true;
    } catch (error) {
      console.error("Error loading contract details:", error);
    }
    this.isLoading = false;
  }

  async fetchContractRecord(recordId, accessToken) {
    console.log("Fetching contract record with access token:", accessToken);
    try {
      const contractRecord = await getContractRecordDetails({
        recordId: recordId
      });
      console.log("Contract record:", contractRecord);
      return contractRecord;
    } catch (error) {
      console.error("Error fetching contract record:", error);
      this.hasContractRecordError = true;
      this.hasError = true;
      throw error;
    }
  }

  async fetchDocumentDetails(contractId, accessToken) {
    console.log("Fetching document details for contract ID:", contractId);
    try {
      const docDetails = await getContractDocumentsDetails({
        contractId: contractId,
        accessToken: accessToken
      });
      if (docDetails.statusCode === 200) {
        this.documentDetails = docDetails.body;
        console.log("Document details:", JSON.stringify(this.documentDetails));
      } else {
        console.error(
          "Error fetching contract documents:",
          docDetails.body[0].error
        );
        this.hasError = true;
      }
    } catch (error) {
      console.error("Error fetching document details:", error);
      this.hasError = true;
      throw error;
    }
  }

  async handleDownload(event) {
    const contractId = event.target.dataset.documentId;
    const storageId = event.target.dataset.storageId;
    const extension = event.target.dataset.extension;

    console.log("extension -->", extension);

    console.log(
      "Downloading document with contractId:",
      contractId,
      "and storageId:",
      storageId
    );
    try {
      const downloadResponse = await downloadDocument({
        storageDocumentId: storageId,
        accessToken: this.cmtToken
      });
      if (downloadResponse.statusCode === 200) {
        this.triggerDownload(downloadResponse.body.data, contractId);
      } else {
        console.error("Error downloading file:", downloadResponse.body.data);
        this.hasError = true;
      }
    } catch (error) {
      console.error("Error handling download:", error);
      this.hasError = true;
    }
  }

  triggerDownload(downloadLink, contractId) {
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = downloadLink;
    downloadAnchor.download = `${contractId}.pdf`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }

  handleView(event) {
    const contractId = event.target.dataset.documentId;
    const storageId = event.target.dataset.storageId;
    console.log(
      "Viewing document with contractId:",
      contractId,
      "and storageId:",
      storageId
    );

    const viewUrl = `https://playground-contracts.intellosync.com/editor/collaborate/${contractId}/${storageId}/view`;
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: { url: viewUrl },
      state: { nooverride: true }
    });
  }
}
