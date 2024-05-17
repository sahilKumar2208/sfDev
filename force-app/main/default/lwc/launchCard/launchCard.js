import { LightningElement, api, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getTemplates from "@salesforce/apex/TemplateController.getTemplates";
import MyModal from "c/launchPageModal";
import COMPANY_LOGO_URL from "@salesforce/resourceUrl/company_logo";
import retrieveCurrentUserAccountDetails from "@salesforce/apex/AccountDetailsController.retrieveCurrentUserAccountDetails";
// import generateToken from "@salesforce/apex/CreateAccessTokenController.generateToken";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";

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
  @track cmtToken;

  get options() {
    return this.templateOptions;
  }

  companyLogoUrl = COMPANY_LOGO_URL;

  async connectedCallback() {
    console.log("record id ------>", this.recordId);

    try {
      // Fetch current user details
      const userDetails = await retrieveCurrentUserAccountDetails();
      console.log("the current user's email", userDetails);

      //   // Generate authentication service token
      //   const authToken = await generateToken({
      //     email: userDetails.Email,
      //     expirationMinutes: 60
      //   });
      //   console.log("auth token --->", authToken);

      //***** HARD CODING THE AUTH TOKEN *********//
      const authToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxNTc3ODI1NSwiZXhwIjoxNzQ3MzM1ODU1fQ.n5mjllU-DbplgTSiQUsNBnMCXOUtHX-eeAudcr-rOoQ";

      // Get CMT token
      let cmtToken = localStorage.getItem(`accessToken`);
      console.log("cmt token in local storage ---->", cmtToken);
      if (!cmtToken) {
        const cmtTokenResponse = await getAccessToken({
          authServiceToken: authToken
        });
        console.log("cmt token here !!", cmtTokenResponse);

        if (cmtTokenResponse.statusCode === 200) {
          cmtToken = cmtTokenResponse.accessToken;
          // Store token in localStorage
          localStorage.setItem(`accessToken`, cmtTokenResponse.accessToken);
          console.log("Access token stored in localStorage");
        } else {
          // show unauthorized !!! OR authorization falied with the given mail message.
        }
      }

      //make a cmt token variable and assign it value.
      this.cmtToken = cmtToken;

      console.log("cccccmmmmttttt token", cmtToken);

      console.log("cmt token hai ???", this.cmtToken);

      // Fetching type of Salesforce object
      const objectType = this.getObjectTypeFromId(this.recordId);
      console.log("Object Type:", objectType);

      // API call to fetch all the templates related to this object (options for combobox)
      if (objectType) {
        this.fetchTemplates(objectType, this.cmtToken);
      } else {
        console.error("Could not determine object type from record Id.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  getObjectTypeFromId(recordId) {
    // Get the first three characters of the recordId
    const prefix = recordId.substring(0, 3);
    // Use the mapping to determine the object type
    return objectPrefixToType[prefix];
  }

  fetchTemplates(objectType, cmtToken) {
    console.log("objecttttttttt iss --->", objectType);
    getTemplates({ objectType: objectType, accessToken: cmtToken })
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
