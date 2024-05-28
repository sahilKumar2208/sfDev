import { LightningElement, api, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getTemplates from "@salesforce/apex/TemplateController.getTemplates";
import MyModal from "c/launchPageModal";
import COMPANY_LOGO_URL from "@salesforce/resourceUrl/company_logo";
import retrieveCurrentUserAccountDetails from "@salesforce/apex/AccountDetailsController.retrieveCurrentUserAccountDetails";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";

// getTemplates;  ---> DONE
// getAccessToken ---> DONE
// retrieveCurrentUserAccountDetails ---> DONE

// Mapping of object prefixes to object types
const objectPrefixToType = {
  "001": "Account",
  "003": "Contact",
  "006": "Opportunity"
};

export default class LaunchCard extends NavigationMixin(LightningElement) {
  @api recordId;
  @track selectedTemplate = "";
  @track templateOptions = [];
  @track isModalOpen = false;
  @track cmtToken;
  @track fetchTemplateError = false;
  @track authError = false;
  @track hasError = false;

  disableLaunchButton = true;
  companyLogoUrl = COMPANY_LOGO_URL;

  get options() {
    return this.templateOptions;
  }

  async connectedCallback() {
    console.log("Record ID:", this.recordId);
    try {
      await this.initializeComponent();
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  async initializeComponent() {
    const userDetails = await this.fetchUserDetails();
    const authToken = await this.fetchAuthToken(userDetails.Email);
    this.cmtToken = await this.retrieveCmtToken(authToken);
    const objectType = this.getObjectTypeFromId(this.recordId);
    if (objectType) {
      this.fetchTemplates(objectType, this.cmtToken);
    } else {
      console.error("Could not determine object type from record Id.");
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

  getObjectTypeFromId(recordId) {
    const prefix = recordId.substring(0, 3);
    return objectPrefixToType[prefix];
  }

  fetchTemplates(objectType, cmtToken) {
    getTemplates({ objectType, accessToken: cmtToken })
      .then((response) => {
        if (response.statusCode === 200) {
          this.templateOptions = response.options.map((template) => ({
            label: template.label,
            value: template.value
          }));
          console.log("Templates fetched:", this.templateOptions);
        } else {
          console.error(
            // Handling non-200 status codes as needed
            "Failed to fetch templates. Status code:",
            response.statusCode
          );
          this.fetchTemplateError = true;
          this.hasError = true;
        }
      })
      .catch((error) => {
        console.error("Error fetching templates:", error);
        this.fetchTemplateError = true;
        this.hasError = true;
      });
  }

  handleTemplateSelection(event) {
    this.selectedTemplate = event.detail.value;
    this.disableLaunchButton = false;
  }

  async handleLaunchPage() {
    const result = await MyModal.open({
      size: "large",
      description: "Accessible description of modal's purpose",
      content: { templateId: this.selectedTemplate, recordId: this.recordId }
    });
    console.log("Modal result:", result);
  }
}

// ┌───────────────────────────────┐
// │ Component Initialization      │
// │ ┌───────────────────────────┐ │
// │ │ connectedCallback()       │ │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Log record ID         │ │ │
// │ │ │ Call initializeComponent │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘

// ┌───────────────────────────────┐
// │ Initialization Component      │
// │ ┌───────────────────────────┐ │
// │ │ initializeComponent()     │ │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Call fetchUserDetails │ │ │
// │ │ │ Call fetchAuthToken   │ │ │
// │ │ │ Call retrieveCmtToken │ │ │
// │ │ │ Call getObjectType    │ │ │
// │ │ │ If valid, fetchTemplates │ │
// │ │ │ Else, log error        │ │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘

// ┌───────────────────────────────┐
// │ Fetch User Details            │
// │ ┌───────────────────────────┐ │
// │ │ fetchUserDetails()        │ │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Call retrieveCurrentUser │ │
// │ │ │ Log user details       │ │ │
// │ │ │ Return user details    │ │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘

// ┌───────────────────────────────┐
// │ Fetch Auth Token              │
// │ ┌───────────────────────────┐ │
// │ │ fetchAuthToken(email)     │ │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Hardcode auth token    │ │ │
// │ │ │ Log auth token         │ │ │
// │ │ │ Return auth token      │ │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘

// ┌───────────────────────────────┐
// │ Retrieve CMT Token            │
// │ ┌───────────────────────────┐ │
// │ │ retrieveCmtToken(authToken) │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Check local storage    │ │ │
// │ │ │ If not found, call get │ │ │
// │ │ │ If 200, store token    │ │ │
// │ │ │ Else, log error        │ │ │
// │ │ │ Log CMT token          │ │ │
// │ │ │ Return CMT token       │ │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘

// ┌───────────────────────────────┐
// │ Get Object Type               │
// │ ┌───────────────────────────┐ │
// │ │ getObjectTypeFromId(recordId) │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Extract prefix from ID │ │ │
// │ │ │ Return object type     │ │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘

// ┌───────────────────────────────┐
// │ Fetch Templates               │
// │ ┌───────────────────────────┐ │
// │ │ fetchTemplates(objectType, │ │
// │ │ cmtToken)                  │ │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Call getTemplates     │ │ │
// │ │ │ Map to templateOptions │ │
// │ │ │ Log fetched templates  │ │ │
// │ │ │ Handle errors          │ │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘

// ┌───────────────────────────────┐
// │ Template Selection            │
// │ ┌───────────────────────────┐ │
// │ │ handleTemplateSelection    │ │
// │ │ (event)                   │ │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Set selected template  │ │ │
// │ │ │ Enable launch button   │ │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘

// ┌───────────────────────────────┐
// │ Launch Page Modal             │
// │ ┌───────────────────────────┐ │
// │ │ handleLaunchPage()        │ │
// │ │ ┌───────────────────────┐ │ │
// │ │ │ Open modal             │ │ │
// │ │ │ Log modal result       │ │ │
// │ │ └───────────────────────┘ │ │
// │ └───────────────────────────┘ │
// └───────────────────────────────┘
