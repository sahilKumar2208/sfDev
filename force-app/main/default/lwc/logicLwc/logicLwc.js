import LightningModal from "lightning/modal";
import { api, track } from "lwc";
import getSFObjectId from "@salesforce/apex/DynamicQueryController.getSFObjectId";

const parentToChildMap = {
  Account: [
    "Contact",
    "Asset",
    "Case",
    "Contract",
    "Opportunity",
    "Order",
    "Quote"
  ],
  Case: ["CaseComment", "EmailMessage", "AttachedContentNote", "CaseHistory"],
  Contact: ["Asset", "Case", "Contract", "Opportunity", "Order", "Quote"],
  Opportunity: [
    "OpportunityLineItem",
    "Quote",
    "Order",
    "Note",
    "AttachedContentNote"
  ]
};

export default class LogicLwc extends LightningModal {
  @track templateId;
  @track recordId;
  @track cmtToken;
  @track iframeUrl;
  @track isLoading;
  @api content;

  // connected callback
  async connectedCallback() {
    this.recordId = this.content.recordId;
    await this.createLaunchForm();
  }

  // rendered callback
  renderedCallback() {
    //
  }

  // disconnected callback
  disconnectedCallback() {
    //
  }

  // create launch form
  async createLaunchForm() {
    // get mapping

    // create dynamic query

    // Dummy data
    const relatedObjects = ["Opportunity", "Account", "Contact", "Case"];
    const fieldName = "ContactEmail";
    console.log("field name ", fieldName);

    let relatedObjectsIds = [];

    relatedObjectsIds.push(this.recordId);

    let knownId = this.recordId;

    for (let i = 0; i < relatedObjects.length - 1; i++) {
      const obj1 = relatedObjects[i];
      const obj2 = relatedObjects[i + 1];

      // find relation btw o1 and o2
      const isParentKnown = this.isParentKnown(obj1, obj2); // obj1 is parent entry in the map & obj2 will be searched in the children list of obj1

      if (isParentKnown === true) {
        // extract the next object's id
        // add it to the array
        // update known id

        const field = "Id";
        const objectName = obj2;
        const condition = `${obj1}Id = ${knownId}`;
        const dynamicQueryResult = getSFObjectId({
          field: field,
          objectName: objectName,
          condition: condition
        });
        console.log("dynamic query result ---->", dynamicQueryResult);

      } else {
        // extract the next object's id
        // add it to the array
        // update known id
        const field = `${obj2}Id`;
        const objectName = obj1;
        const condition = `Id = ${knownId}`;
        const dynamicQueryResult = getSFObjectId({
          field: field,
          objectName: objectName,
          condition: condition
        });
        console.log("dynamic query result ---->", dynamicQueryResult);

      }
    }

    // use the mapping and the retrieved data to get create Attribute VS its value mapping
  }

  isParentKnown(parent, child) {
    if (parent in parentToChildMap) {
      return parentToChildMap[parent].includes(child);
    }
    return false;
  }
}
