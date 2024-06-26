import { LightningElement, track, api } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDocumentsDetails from "@salesforce/apex/ContractDetailsController.getContractDocumentsDetails";
import downloadDocument from "@salesforce/apex/ContractDetailsController.downloadDocument";
import retrieveCurrentUserAccountDetails from "@salesforce/apex/AccountDetailsController.retrieveCurrentUserAccountDetails";
import getExpiryTime from "@salesforce/apex/JwtDecoder.getExpiryTime";
import { NavigationMixin } from "lightning/navigation";
import ViewDocModal from "c/viewDocumentModal";

export default class ContractDocuments extends NavigationMixin(
  LightningElement
) {
  @track isLoading = true;
  @track isContractDetailsPresent = false;
  @track contractId;
  @api recordId;
  @track documentDetails;
  @track cmtToken;
  @track storageDocumentId;

  @track authError = false;
  @track hasError = false;
  @track hasContractRecordError = false;

  @track isModalOpen = false;
  @track viewUrl;

  async connectedCallback() {
    const userDetails = await this.fetchUserDetails();
    const authToken = await this.fetchAuthToken(userDetails.Email);
    this.cmtToken = await this.retrieveCmtToken(authToken);

    if (this.cmtToken) {
      await this.loadContractDetails();
      this.isLoading = false;
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
        throw error;
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
      throw error;
    }
  }

  triggerDownload(downloadLink, contractId) {
    try {
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = downloadLink;
      downloadAnchor.download = `${contractId}.pdf`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (error) {
      console.error("Error setting up download:", error);
      this.hasError = true;
      throw error;
    }
  }

  handleView(event) {
    const contractId = event.target.dataset.documentId;
    const storageId = event.target.dataset.storageId;
    const extension = event.target.dataset.extension;
    const nameOfDoc = event.target.dataset.documentName;

    console.log(
      "Viewing document with contractId:",
      contractId,
      "and storageId:",
      storageId,
      "and extension:",
      extension
    );

    if (extension.toLowerCase() === "pdf") {
      // Call handleDownload function
      this.handleDownload(event);
    } else {
      // Open the document in the modal
      this.viewUrl = `https://playground-contracts.intellosync.com/editor/collaborate/${contractId}/${storageId}/view`;
      this.handleLaunchPage(nameOfDoc);
    }
  }

  async handleLaunchPage(nameOfDoc) {
    const result = await ViewDocModal.open({
      size: "large",
      description: "Accessible description of modal's purpose",
      content: { viewUrl: this.viewUrl, nameOfDoc: nameOfDoc }
    });
    console.log("view document modal result:", result);
  }
}
