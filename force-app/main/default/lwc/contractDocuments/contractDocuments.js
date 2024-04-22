import { LightningElement, track, api } from "lwc";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import getContractRecordDetails from "@salesforce/apex/ContractRecordDetailsController.getContractRecordDetails";
import getContractDocumentsDetails from "@salesforce/apex/ContractDetailsController.getContractDocumentsDetails";
import downloadDocument from "@salesforce/apex/ContractDetailsController.downloadDocument";
import { NavigationMixin } from "lightning/navigation";

// const extensionToMimeType = {
//   jpg: "image/jpeg",
//   jpeg: "image/jpeg",
//   png: "image/png",
//   gif: "image/gif",
//   pdf: "application/pdf",
//   txt: "text/plain",
//   docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   wopitest:
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//   xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
// };

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

  async connectedCallback() {
    const authToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxMzE3MDYwOCwiZXhwIjoxNzE0MjUwNjA4fQ.MzfWSuy3mhu7yTmiCijijOpPaT3SVZg3DPQSjPeQ_Dk";

    // Get CMT token
    let cmtToken = localStorage.getItem(`accessToken`);
    if (!cmtToken) {
      cmtToken = await getAccessToken({ authServiceToken: authToken });
      console.log("cmt token here !!", cmtToken);
      // Store token in localStorage
      localStorage.setItem(`accessToken`, cmtToken);
      console.log("Access token stored in localStorage");
    }

    this.cmtToken = cmtToken;
    console.log("record id of contract details", this.recordId);

    // get the contract id
    // by getting the record details through salesforce
    this.isLoading = true;
    await this.fetchContractRecord(this.recordId, cmtToken);
    this.isLoading = false;
    this.isContractDetailsPresent = true;
  }

  // this will fetch contract record details present in salesforce
  async fetchContractRecord(recordId, accessToken) {
    console.log("access token in fetch contract record is -->", accessToken);
    try {
      const contractRecord = await getContractRecordDetails({
        recordId: recordId
      });
      console.log("contract record is -->", contractRecord);
      this.contractId = contractRecord.Intellosync_workflow_id__c;
      const docDetails = await getContractDocumentsDetails({
        contractId: contractRecord.Intellosync_workflow_id__c,
        accessToken: accessToken
      });
      console.log(" Document details of the contract are --->", docDetails);

      if (docDetails.statusCode === 200) {
        this.documentDetails = docDetails.body;
        console.log("doc detail ", JSON.stringify(this.documentDetails));
      } else {
        console.log(
          "Error fetching contract documents:",
          docDetails.body[0].error
        );
      }
    } catch (error) {
      console.log("error in fetching the contract record", error);
    }
  }

  async handleDownload(event) {
    const contractId = event.target.dataset.documentId;
    const storageId = event.target.dataset.storageId;
    const extension = event.target.dataset.extension;

    console.log("extension iss -->", extension);
    console.log(
      "Downloading document with contractId:",
      contractId,
      "and storageId:",
      storageId
    );

    const downloadResponse = await downloadDocument({
      storageDocumentId: storageId,
      accessToken: this.cmtToken
    });

    if (downloadResponse.statusCode === 200) {
      const downloadLink = downloadResponse.body.data;


      // Create a temporary anchor element
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = downloadLink;
      downloadAnchor.download = `${contractId}.pdf`; // Set the desired file name and extension
      document.body.appendChild(downloadAnchor);

      // Simulate a click event on the anchor element
      downloadAnchor.click();

      // Remove the temporary anchor element
      document.body.removeChild(downloadAnchor);
    } else {
      console.error("Error downloading file:", downloadResponse.body.data);
    }
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

    //https://playground-contracts.intellosync.com/editor/collaborate/6626025aa6cfea740258d637/6626025a8c306d47f46f022f/view
    // Construct the URL you want to open
    const viewUrl = `https://playground-contracts.intellosync.com/editor/collaborate/${contractId}/${storageId}/view`;

    // Open the URL in a new tab
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: viewUrl
      },
      state: {
        nooverride: true
      }
    });
  }
  // target
  // 1. view details of all the documents (mtlb naam of document)
  // 2. add 2 buttons on each item, one for view , other for download
  // view wala me new tab khulwana hai with the id
  // download wale me download krwane ke liye bas api call krna hai (this requires the storage id)
  // requirement
  // an array with the name of the document and its contractId and storageDocumentId
  // url: https://cmt-backend-playground.intellosync.com/api/v1/document/contract/6626025aa6cfea740258d637
}
