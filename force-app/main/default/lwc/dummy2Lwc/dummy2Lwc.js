import { LightningElement } from "lwc";

export default class Dummy2Lwc extends LightningElement {
  documents = [
    {
      _id: "6626025ba6cfea740258d648",
      nameOfDocument: "Sales 008 contract",
      sizeOfUploadedFileInBytes: 19239,
      orgId: "65e7e5f72e7cd34c3ca25964",
      uploadedBy: "65e7f48029caab7e4c88c249",
      contractId: "6626025aa6cfea740258d637",
      storageDocumentId: "6626025a8c306d47f46f022f"
    },
    {
      _id: "6626025ba6cfea740258d649",
      nameOfDocument: "Sales 009 contract",
      sizeOfUploadedFileInBytes: 19239,
      orgId: "65e7e5f72e7cd34c3ca25964",
      uploadedBy: "65e7f48029caab7e4c88c249",
      contractId: "6626025aa6cfea740258d638",
      storageDocumentId: "6626025a8c306d47f46f0230"
    }
  ];

  handleDownload(event) {
    const contractId = event.target.dataset.documentId;
    const storageId = event.target.dataset.storageId;
    console.log(
      "Downloading document with contractId:",
      contractId,
      "and storageId:",
      storageId
    );
    // Implement download logic here using contractId and storageId
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
    // Implement view logic here using contractId and storageId
  }
}
