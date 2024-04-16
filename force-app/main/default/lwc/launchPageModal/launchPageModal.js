import { api, track } from "lwc";
import LightningModal from "lightning/modal";
// import getOpportunityDetails from '@salesforce/apex/OpportunityDetails.getOpportunityDetails';
import uploadOpportunityDetails from "@salesforce/apex/OpportunityController.uploadOpportunityDetails";
import uploadAccountDetails from "@salesforce/apex/AccountController.uploadAccountDetails";
import uploadContactDetails from "@salesforce/apex/ContactController.uploadContactDetails";
import uploadOwnerDetails from "@salesforce/apex/OwnerController.uploadOwnerDetails";
import getOpportunityDetails from "@salesforce/apex/OpportunityController.getOpportunityDetails";
import createLaunchForm from "@salesforce/apex/LaunchFormController.createLaunchForm";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";

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
  @track isLoading = true;

  // orgId, templateId, recordId

  async connectedCallback() {
    console.log("connected call back of modal is called");

    const authToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxMzE3MDYwOCwiZXhwIjoxNzE0MjUwNjA4fQ.MzfWSuy3mhu7yTmiCijijOpPaT3SVZg3DPQSjPeQ_Dk";

    // Get CMT token
    let cmtToken = localStorage.getItem(`accessToken`);
    if (!cmtToken) {
      cmtToken = await getAccessToken({
        authServiceToken: authToken
      });
      console.log("cmt token here !!", cmtToken);

      // Store token in localStorage
      localStorage.setItem(`accessToken`, cmtToken);
      console.log("Access token stored in localStorage");
    }

    // this.loadOpportunityDetails(); //and this function also saves the "opp" data to our db.
    this.createLaunchForm(cmtToken);

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

  async createLaunchForm(accessToken) {
    console.log("Hii token !! -->", accessToken);
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
        console.log("acccccccccccc tookkkkk", accessToken);
        // Step2 : Save all the retrieve to db
        // Await all the asynchronous calls
        console.log("yooooooo !!!!!");
        await Promise.all([
          this.postOpportunityDetails(
            {
              jsonData: JSON.stringify({
                opportunity: opportunityDataResponse.opportunity,
                recordId: this.content.recordId
              })
            },
            accessToken
          ),
          this.postAccountDetails(
            {
              jsonData: JSON.stringify({
                account: opportunityDataResponse.account,
                recordId: this.content.recordId
              })
            },
            accessToken
          ),
          this.postContactDetails(
            {
              jsonData: JSON.stringify({
                contact: opportunityDataResponse.contacts,
                recordId: this.content.recordId
              })
            },
            accessToken
          ),
          this.postOwnerDetails(
            {
              jsonData: JSON.stringify({
                owner: opportunityDataResponse.owner,
                recordId: this.content.recordId
              })
            },
            accessToken
          )
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
          recordId: this.content.recordId,
          accessToken: accessToken
        });

        console.log("this.launchId", this.launchId.replace(/"/g, ""));
        // Remove double quotes from this.launchId
        const launchIdWithoutQuotes = this.launchId.replace(/"/g, "");
        // this.iframeUrl = `http://localhost:8080/123/launch/${launchIdWithoutQuotes}`;
        this.iframeUrl = `http://localhost:8080/123/launch/${launchIdWithoutQuotes}`;

        if (this.iframeUrl) {
          this.isLoading = false;
        }
      }
    }
  }

  async postOpportunityDetails(jsonData, accessToken) {
    console.log(
      "opportunity result json data is --->",
      JSON.stringify(jsonData.jsonData)
    );
    console.log("access token  in post opp--->", accessToken);

    try {
      const uploadResult = await uploadOpportunityDetails({
        jsonData: jsonData.jsonData,
        accessToken: accessToken
      });
      console.log("Opportunity Upload Result:", uploadResult);
    } catch (error) {
      console.error("Error uploading Opportunity Details 111111:", error);
    }
  }

  async postAccountDetails(jsonData, accessToken) {
    console.log(
      "account result json data is --->",
      JSON.stringify(jsonData.jsonData)
    );
    try {
      const uploadResult = await uploadAccountDetails({
        jsonData: jsonData.jsonData,
        accessToken: accessToken
      });
      console.log("Account Upload Result:", uploadResult);
    } catch (error) {
      console.error("Error uploading Account Details 222222:", error);
    }
  }

  async postContactDetails(jsonData, accessToken) {
    console.log(
      "contact result json data is --->",
      JSON.stringify(jsonData.jsonData)
    );
    try {
      const uploadResult = await uploadContactDetails({
        jsonData: jsonData.jsonData,
        accessToken: accessToken
      });
      console.log("Contact Upload Result:", uploadResult);
    } catch (error) {
      console.error("Error uploading Contact Details 333333:", error);
    }
  }

  async postOwnerDetails(jsonData, accessToken) {
    console.log(
      "owner result json data is --->",
      JSON.stringify(jsonData.jsonData)
    );
    try {
      const uploadResult = await uploadOwnerDetails({
        jsonData: jsonData.jsonData,
        accessToken: accessToken
      });
      console.log("Owner Upload Result:", uploadResult);
    } catch (error) {
      console.error("Error uploading Owner Details 44444:", error);
    }
  }
}
