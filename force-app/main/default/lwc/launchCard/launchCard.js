import { LightningElement, api, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getTemplates from "@salesforce/apex/TemplateController.getTemplates";
import MyModal from "c/launchPageModal";
import COMPANY_LOGO_URL from "@salesforce/resourceUrl/company_logo";

// mapping of object prefixes to object types
const objectPrefixToType = {
  "001": "Account",
  "003": "Contact",
  "006": "Opportunity"
};

export default class LaunchCard extends NavigationMixin(LightningElement) {
  @api recordId;
  @track selectedTemplate = "";
  @track templateOptions = [];
  disableLaunchButton = true;
  @track isModalOpen = false;

  get options() {
    return this.templateOptions;
  }

  companyLogoUrl = COMPANY_LOGO_URL;

  connectedCallback() {
    console.log("record id ------>", this.recordId);

    // Fetching type of Salesforce object
    const objectType = this.getObjectTypeFromId(this.recordId);
    console.log("Object Type:", objectType);

    // API call to fetch all the templates related to this object (options for combobox)
    if (objectType) {
      this.fetchTemplates(objectType);
    } else {
      console.error("Could not determine object type from record Id.");
    }
  }

  getObjectTypeFromId(recordId) {
    // Get the first three characters of the recordId
    const prefix = recordId.substring(0, 3);
    // Use the mapping to determine the object type
    return objectPrefixToType[prefix];
  }

  fetchTemplates(objectType) {
    console.log("objecttttttttt iss --->", objectType);
    getTemplates({ objectType: objectType })
      .then((result) => {
        console.log("result iss ---->", result);
        // Handle the result, which contains template options
        this.templateOptions = result.map((template) => ({
          label: template.label,
          value: template.value
        }));
      })
      .catch((error) => {
        // Handle any errors from the Apex call
        console.error("Error fetching templates:", error);
      });
  }

  handleTemplateSelection(event) {
    this.selectedTemplate = event.detail.value;
    // Enable launch button once a template is selected
    this.disableLaunchButton = false;
  }

  async handleLaunchPage() {
    const result = await MyModal.open({
      // `label` is not included here in this example.
      // it is set on lightning-modal-header instead
      size: "large",
      description: "Accessible description of modal's purpose",
      content: { templateId: this.selectedTemplate, recordId: this.recordId }
    });
    // if modal closed with X button, promise returns result = 'undefined'
    // if modal closed with OK button, promise returns result = 'okay'
    console.log(result);
  }
}
