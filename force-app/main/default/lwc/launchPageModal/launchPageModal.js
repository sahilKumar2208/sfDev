import { api } from "lwc";
import LightningModal from "lightning/modal";
// import getOpportunityDetails from '@salesforce/apex/OpportunityDetails.getOpportunityDetails';
import uploadOpportunityDetails from "@salesforce/apex/OpportunityController.uploadOpportunityDetails";
import uploadAccountDetails from "@salesforce/apex/AccountController.uploadAccountDetails";
import uploadContactDetails from "@salesforce/apex/ContactController.uploadContactDetails";
import uploadOwnerDetails from "@salesforce/apex/OwnerController.uploadOwnerDetails";
import getOpportunityDetails from "@salesforce/apex/OpportunityController.getOpportunityDetails";
import createLaunchForm from "@salesforce/apex/LaunchFormController.createLaunchForm";

// mapping of object prefixes to object types
const recordIdPrefixToObjectType = {
  "001": "Account",
  "003": "Contact",
  "006": "Opportunity"
};

export default class LaunchPageModal extends LightningModal {
  @api content;
  launchId;
  iframeUrl;
  // orgId, templateId, recordId

  connectedCallback() {
    console.log("connected call back of modal is called");

    // this.loadOpportunityDetails(); //and this function also saves the "opp" data to our db.
    this.createLaunchForm();

    //save all the data related to current salesforce object
    //iframe url hit kro... and in the next js fetch config, fetch sf obj's data fill out form
    //so iframe url me there should be something which tells kii kon saa orgId and kon saa template use krna hai
    // saved opportunity data kaise fetch kroge? url me recordId bejo db me recordId hai "Id" ke naame se
  }

  renderedCallback() {
    // this.iframeUrl = `http://localhost:8080/123/launch/${this.content.templateId}/${this.content.recordId}`

    console.log("ifrmae urlll issssss ----->", this.iframeUrl);
  }

  handleOkay() {
    this.close("okay");
  }

  async createLaunchForm() {
    console.log("Hiiiiiiiiiiiiiiiiii !!!!!!!!!!");
    //isme bohot saara kaam krna hai
    // 1. get all the details relevant to that particular recordId
    // 2. Save all that details to our private db
    // 3. create attribute vs value map using mapping config and saved record details
    // and return launch form Id
    // basically 3rd step me an entry of type Launch Form model will be created in db that will contain
    // template name , template attribute values, templateId
    // and end me iss launch form Id ko iframe url me append kr dena hai

    // ******* CODING START ******
    const recordIdPrefix = this.content.recordId.substring(0, 3);

    const objectType = recordIdPrefixToObjectType[recordIdPrefix];

    if (objectType === "Opportunity") {
      // Step 1: get opportunity object and other relevant data to that object
      const opportunityDataResponse = await getOpportunityDetails({
        opportunityId: this.content.recordId
      });

      console.log(
        "opportuntiy and other related data response ---->",
        opportunityDataResponse
      );

      if (opportunityDataResponse.errorMsg) {
        console.error(
          "Error fetching Opportunity Details issssssss:",
          opportunityDataResponse.errorMsg
        );
      } else {
        // Step2 : Save all the retrieve to db
        // Await all the asynchronous calls
        console.log("yooooooo !!!!!");
        await Promise.all([
          this.postOpportunityDetails({
            jsonData: JSON.stringify({
              opportunity: opportunityDataResponse.opportunity,
              recordId: this.content.recordId
            })
          }),
          this.postAccountDetails({
            jsonData: JSON.stringify({
              account: opportunityDataResponse.account,
              recordId: this.content.recordId
            })
          }),
          this.postContactDetails({
            jsonData: JSON.stringify({
              contact: opportunityDataResponse.contacts,
              recordId: this.content.recordId
            })
          }),
          this.postOwnerDetails({
            jsonData: JSON.stringify({
              owner: opportunityDataResponse.owner,
              recordId: this.content.recordId
            })
          })
        ]);

        // Step 3: attribute vs value kaa maapping add krna hai
        // templateName, orgId, templateVersion, templateType, contractFields[ { id, value} ];
        // step a. fetch template  ( templateId, orgId )
        // step b. get the mapping configuration (templateId, orgId)
        // step c. get all the data you want for the opportunity related record ( orgId, recordId )
        // step d. add logic to create the attribute vs value mapping and create launchForm entry

        // ************ CODING STARTS **************

        // step a.

        this.launchId = await createLaunchForm({
          templateId: this.content.templateId,
          recordId: this.content.recordId
        });

        console.log("this.launchId", this.launchId);
        this.iframeUrl = `http://localhost:8080/123/launch/${this.launchId}`;
      }
    }
  }

  async postOpportunityDetails(jsonData) {
    console.log("result json data is --->", jsonData);
    try {
      const uploadResult = await uploadOpportunityDetails(jsonData);
      console.log("Upload Result:", uploadResult);
    } catch (error) {
      console.error("Error uploading Opportunity Details 111111:", error);
    }
  }

  async postAccountDetails(jsonData) {
    console.log("result json data is --->", jsonData);
    try {
      const uploadResult = await uploadAccountDetails(jsonData);
      console.log("Upload Result:", uploadResult);
    } catch (error) {
      console.error("Error uploading Account Details 222222:", error);
    }
  }

  async postContactDetails(jsonData) {
    console.log("result json data is --->", jsonData);
    try {
      const uploadResult = await uploadContactDetails(jsonData);
      console.log("Upload Result:", uploadResult);
    } catch (error) {
      console.error("Error uploading Contact Details 333333:", error);
    }
  }

  async postOwnerDetails(jsonData) {
    console.log("result json data is --->", jsonData);
    try {
      const uploadResult = await uploadOwnerDetails(jsonData);
      console.log("Upload Result:", uploadResult);
    } catch (error) {
      console.error("Error uploading Owner Details 44444:", error);
    }
  }
}
