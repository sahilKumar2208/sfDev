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
import createContractRecord from "@salesforce/apex/ContractRecordDetailsController.createContractRecord";
import getSFObjectId from "@salesforce/apex/DynamicQueryController.getSFObjectId";
import getFieldValue from "@salesforce/apex/DynamicQueryController.getFieldValue";
import fetchMappingConfig from "@salesforce/apex/MappingConfigController.fetchMappingConfig";
import getParentReferenceName from "@salesforce/apex/MappingConfigController.getParentReferenceName";

// mapping of object prefixes to object types
const recordIdPrefixToObjectType = {
  "001": "Account",
  "003": "Contact",
  "006": "Opportunity"
};

export default class LaunchPageModal extends LightningModal {
  @api content;
  launchId;
  @track iframeUrl;
  cmtToken;
  @track isLoading = true;

  // orgId, templateId, recordId

  async connectedCallback() {
    console.log("connected call back of modal is called");

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

    this.cmtToken = cmtToken;

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

    const STYLE = document.createElement("style");
    STYLE.innerText = `.slds-modal_large .slds-modal__container{
      width: 98%;
      max-width: none;
      min-width: 40rem;}`;
    this.template.querySelector("lightning-modal-body").appendChild(STYLE);

    window.addEventListener("message", this.handleMessageFromReactApp);
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.handleMessageBound);
  }

  async handleMessageFromReactApp(event) {
    try {
      // Perform operations with the form data received from the React app
      const data = event.data;
      console.log("Message from React app:", data.contractCreationResponse);

      // Create a record in Salesforce
      const contractsalesforceRecordCreationResponse =
        await createContractRecord({
          toolContractCreationResponse: data.contractCreationResponse
        });

      console.log(
        "contttt resss --->",
        contractsalesforceRecordCreationResponse
      );

      // Check if the record creation was successful
      if (contractsalesforceRecordCreationResponse === 201) {
        console.log("Contract record created successfully");
        event.source.postMessage("job-done", "*");
      } else {
        console.error(
          "Error creating contract record:",
          contractsalesforceRecordCreationResponse
        );
        event.source.postMessage("job-failed", "*");
      }
    } catch (error) {
      console.error("Error creating contract record:", error);
    }
  }

  handleOkay() {
    this.close("okay");
  }

  // create launch form
  async createLaunchForm() {
    console.log("template Id --->", this.content.templateId);
    console.log("accessToken --->", this.cmtToken);
    // get mapping
    const mappingConfig = await fetchMappingConfig({
      accessToken: this.cmtToken,
      templateId: this.content.templateId
    });

    console.log("mapping config response --->", mappingConfig);

    // use the mapping and the retrieved data to get create Attribute VS its value mapping
    let attributeValueMap = {};

    const queryStart = Date.now();
    console.log("query startsss --->", queryStart);
    let i = 1;

    for (const entry of mappingConfig.data) {
      const prevQueryStart = Date.now();
      console.log("entry isss ---->", entry);

      const salesforceFieldValue = await this.getLeafFieldValue(entry);
      // attributeValueMap[entry.templateAttributeId] =
      //   await this.getLeafFieldValue(entry);

      // console.log(`time for ${i} query`, Date.now() - prevQueryStart, "value returned --->", attributeValueMap[entry.templateAttributeId]);
      // i++;

      attributeValueMap[entry.templateAttributeId] =
        this.transformSalesforceData(
          salesforceFieldValue,
          entry.externalSystemAttributeType
        );
    }

    console.log(
      "attribute value map -------->",
      JSON.stringify(attributeValueMap)
    );

    // and make call to external mapper service to make launch form
    const mapping = mappingConfig.data[0];

    const launchFormData = {
      platform: "salesforce",
      templateId: this.content.templateId,
      templatename: mapping.templateName,
      templateType: mapping.contractType,
      templateVersion: mapping.templateVersion,
      contractFields: this.processData(attributeValueMap)
    };

    const launchFormDataStr = JSON.stringify(launchFormData);

    this.launchId = await createLaunchForm({
      accessToken: this.cmtToken,
      launchFormDataStr: launchFormDataStr
    });

    console.log(
      "this.launchId",
      this.launchId.replace(/"/g, ""),
      "queryEnds",
      Date.now()
    );
    // Remove double quotes from this.launchId
    const launchIdWithoutQuotes = this.launchId.replace(/"/g, "");
    // this.iframeUrl = `http://localhost:8080/123/launch/${launchIdWithoutQuotes}`;
    // this.iframeUrl = `http://localhost:8080/123/launch/${launchIdWithoutQuotes}`;
    this.iframeUrl = `http://localhost:5173/newContract/external/launch/${launchIdWithoutQuotes}`;

    if (this.iframeUrl) {
      this.isLoading = false;
    }
  }

  transformSalesforceData(salesforceFieldValue, externalSystemAttributeType) {
    //
    console.log("I was called !!!");
    if (externalSystemAttributeType === "Address") {
      const address = {};
      console.log("address type !!!");

      address.addressLine1 = salesforceFieldValue.street;
      address.city = salesforceFieldValue.city;
      address.state = salesforceFieldValue.state;
      address.postCode = salesforceFieldValue.postalCode;
      address.country = salesforceFieldValue.country;

      return address;
    }else if( externalSystemAttributeType === "Date"){
      const date = new Date(salesforceFieldValue).getTime();
      return date;
    }
    return salesforceFieldValue;
  }

  processData(data) {
    const newData = {};

    console.log("process data was called !!!");

    for (const key in data) {
      const parts = key.split(".");
      if (parts.length === 1) {
        newData[parts[0]] = data[key];
        continue;
      }
      const fieldName = parts[0];
      const nestedFieldName = parts.slice(1).join(".");

      if (!newData[fieldName]) {
        newData[fieldName] = {};
      }

      newData[fieldName][nestedFieldName] = data[key];
    }

    return newData;
  }

  async getLeafFieldValue(entry) {
    // pass one entry at a time
    const sourceObject = entry.salesforce.launchObjectType;
    console.log("source object", sourceObject);
    const relatedObjectsData = entry.salesforce.relatedObjects;
    console.log(
      " number of related objects time for  --->",
      relatedObjectsData.length
    );
    console.log(
      "related objects data --->",
      JSON.stringify(relatedObjectsData)
    );

    const isDirectMapping = relatedObjectsData.length !== 0 ? false : true;
    const leafObject = isDirectMapping
      ? sourceObject
      : relatedObjectsData[relatedObjectsData.length - 1].objectName;
    console.log("leaf object --->", leafObject);
    const leafField = entry.externalSystemAttributeName;
    console.log("leaf field ---->", leafField);

    const relatedObjectsIds = isDirectMapping
      ? []
      : await this.retrieveObjectIds(
          sourceObject,
          relatedObjectsData,
          this.content.recordId
        );

    console.log("related objects ids ---->", JSON.stringify(relatedObjectsIds));

    const leafObjectId = isDirectMapping
      ? this.content.recordId
      : relatedObjectsIds[relatedObjectsIds.length - 1].replace(/"/g, "");

    const fieldValue = await getFieldValue({
      field: leafField,
      objectName: leafObject,
      condition: ` Id = '${leafObjectId}' `
    });

    console.log(
      `leaf field i.e.  ${leafField} value for leafObjet ${leafObject} iss --->`,
      fieldValue[0][`${leafField}`]
    );

    return fieldValue[0][`${leafField}`];
  }

  async retrieveObjectIds(sourceObject, relatedObjectsData, knownRecordId) {
    let relatedObjectsIds = [];
    relatedObjectsIds.push(knownRecordId);
    let knownId = knownRecordId;

    console.log("recordId iisss --->", knownId);

    const newEntry = {
      objectName: sourceObject
    };

    relatedObjectsData = [newEntry, ...relatedObjectsData];

    console.log(
      "related objects data array --->",
      JSON.stringify(relatedObjectsData)
    );

    for (let i = 0; i < relatedObjectsData.length - 1; i++) {
      const objectData1 = relatedObjectsData[i];
      const objectData2 = relatedObjectsData[i + 1];

      console.log("object data 1 --->", JSON.stringify(objectData1));
      console.log("object data 2----->", JSON.stringify(objectData2));

      const obj1 = objectData1.objectName;

      console.log("obj 1 ----->", obj1);

      const obj2 = objectData2.objectName;
      let filterConditionObj2 = objectData2.filterConditions;
      let sortingConditionObj2 =
        objectData2.sortingField === undefined &&
        objectData2.sortingOrder === undefined
          ? null
          : {
              sortingField: objectData2.sortingField,
              sortingOrder: objectData2.sortingOrder
            };

      console.log(
        "sorting condition for obj 2 ---->",
        JSON.stringify(sortingConditionObj2)
      );

      if (
        filterConditionObj2 === undefined ||
        filterConditionObj2.length === 0
      ) {
        filterConditionObj2 = null;
      }

      console.log("obj 2 ------>", obj2);
      console.log("filter condition for 2nd obj --->", filterConditionObj2);

      let filterCondition;

      if (filterConditionObj2 !== null) {
        console.log("HIIIIIIIIII");
        filterCondition = `${filterConditionObj2[0]?.fieldName} = '${filterConditionObj2[0]?.fieldValue}'`;
      }

      let sortingCondition;

      if (sortingConditionObj2 !== null) {
        sortingCondition = `${sortingConditionObj2.sortingField} ${sortingConditionObj2.sortingOrder}`;
      }

      console.log("sorting condition ---->", sortingCondition);

      console.log("filter condition --->", filterCondition);

      // find relation btw o1 and o2

      //	1. Find out who is parent
      const isParentKnown = relatedObjectsData[i + 1].isChild;
      console.log("is parent known --->", isParentKnown);

      // find mandatory condition i.e _Parent_Object's Reference Name
      // const parent = isParentKnown ? obj1 : obj2;

      // const child = isParentKnown ? obj2 : obj1;

      // make api call to
      //2. Find child relation (means find object which is child in the child relation array of the parent)
      //3. Find field name from that (this will be the field that will reference the parent object)
      // const parentObjReferenceName = await getParentReferenceName({
      //   parent: parent,
      //   child: child
      // });

      // Cases will be written over here: if P -> C is there parent reference name is different
      // if C -> P is known parent reference name is different
      const referenceFieldName = objectData2.referenceFieldName;

      // console.log(
      //   "parent object reference name iss --->",
      //   parentObjReferenceName
      // );
      console.log("new code running !!!");

      if (isParentKnown === true) {
        // extract the next object's id
        // add it to the array
        // update known id
        console.log("Hiiii");
        const field = `Id`;
        const objectName = obj2;
        const mandatoryCondition = ` ${referenceFieldName} = '${knownId}' `; // this will change
        console.log(
          "mandatory",
          mandatoryCondition,
          "filter conddd",
          filterCondition
        );
        const dynamicQueryResult = await this.fetchSFObjectId(
          field,
          objectName,
          mandatoryCondition,
          filterCondition,
          sortingCondition
        );
        // Process dynamicQueryResult
        console.log("dynamic query result --->", dynamicQueryResult);
        relatedObjectsIds.push(dynamicQueryResult[0][`${field}`]);
        knownId = dynamicQueryResult[0][`${field}`];
      } else {
        // extract the next object's id
        // add it to the array
        // update known id
        const field = `${referenceFieldName}`; // this will change
        const objectName = obj1;
        const mandatoryCondition = ` Id = '${knownId}' `;
        const dynamicQueryResult = await this.fetchSFObjectId(
          field,
          objectName,
          mandatoryCondition,
          filterCondition,
          sortingCondition
        );
        // Process dynamicQueryResult
        console.log("dynamic query result --->", dynamicQueryResult);
        relatedObjectsIds.push(dynamicQueryResult[0][`${field}`]);
        knownId = dynamicQueryResult[0][`${field}`];
      }
    }

    return relatedObjectsIds;
  }

  async fetchSFObjectId(
    field,
    objectName,
    mandatoryCondition,
    filterCondition,
    sortingCondition
  ) {
    try {
      console.log("fun2");
      const res = await getSFObjectId({
        field: field,
        objectName: objectName,
        mandatoryCondition: mandatoryCondition,
        filterCondition: filterCondition,
        sortingCondition: sortingCondition
      });

      console.log("res isss --->", res);
      return res;
    } catch (error) {
      console.error("Error in executeQuery:", error);
      throw error; // Optionally re-throw the error if you want to propagate it further
    }
  }

  // async retrieveObjectIds(relatedObjects, knownRecordId) {
  //   let relatedObjectsIds = [];
  //   relatedObjectsIds.push(knownRecordId);
  //   let knownId = knownRecordId;

  //   console.log("record Id is", knownId);

  //   for (let i = 0; i < relatedObjects.length - 1; i++) {
  //     const obj1 = relatedObjects[i];
  //     const obj2 = relatedObjects[i + 1];

  //     console.log("object 1 --->", obj1);
  //     console.log("object 2 ---->", obj2);

  //     // find relation btw o1 and o2
  //     const isParentKnown = this.isParentKnown(obj1, obj2);

  //     console.log("is parent known --->", isParentKnown);
  //     // obj1 is parent entry in the map & obj2 will be searched in the children list of obj1
  //     if (isParentKnown === true) {
  //       // extract the next object's id
  //       // add it to the array
  //       // update known id
  //       console.log("Hiiii");
  //       const field = `Id`;
  //       const objectName = obj2;
  //       const mandatoryCondition = ` ${obj1}Id = '${knownId}' `;
  //       const dynamicQueryResult = await this.fetchSFObjectId(
  //         field,
  //         objectName,
  //         mandatoryCondition
  //       );
  //       // Process dynamicQueryResult
  //       console.log("dynamic query result --->", dynamicQueryResult);
  //       relatedObjectsIds.push(dynamicQueryResult[0][`${field}`]);
  //       knownId = dynamicQueryResult[0][`${field}`];
  //     } else {
  //       // extract the next object's id
  //       // add it to the array
  //       // update known id
  //       const field = `${obj2}Id`;
  //       const objectName = obj1;
  //       const mandatoryCondition = ` Id = '${knownId}' `;
  //       const dynamicQueryResult = await this.fetchSFObjectId(
  //         field,
  //         objectName,
  //         mandatoryCondition
  //       );
  //       // Process dynamicQueryResult
  //       console.log("dynamic query result --->", dynamicQueryResult);
  //       relatedObjectsIds.push(dynamicQueryResult[0][`${field}`]);
  //       knownId = dynamicQueryResult[0][`${field}`];
  //     }
  //   }
  //   return relatedObjectsIds;
  // }

  // async createLaunchForm(accessToken) {
  //   console.log("Hii token !! -->", accessToken);
  //   //isme bohot saara kaam krna hai
  //   // 1. get all the details relevant to that particular recordId
  //   // 2. Save all that details to our private db
  //   // 3. create attribute vs value map using mapping config and saved record details
  //   // and return launch form Id
  //   // basically 3rd step me an entry of type Launch Form model will be created in db that will contain
  //   // template name , template attribute values, templateId
  //   // and end me iss launch form Id ko iframe url me append kr dena hai

  //   // ******* CODING START ******
  //   const recordIdPrefix = this.content.recordId.substring(0, 3);

  //   const objectType = recordIdPrefixToObjectType[recordIdPrefix];

  //   if (objectType === "Opportunity") {
  //     // Step 1: get opportunity object and other relevant data to that object
  //     const opportunityDataResponse = await getOpportunityDetails({
  //       opportunityId: this.content.recordId
  //     });

  //     console.log(
  //       "opportuntiy and other related data response ---->",
  //       opportunityDataResponse
  //     );

  //     if (
  //       opportunityDataResponse.errorMsg ||
  //       opportunityDataResponse.statusCode !== 200
  //     ) {
  //       // this means the query to salesforce to fetch the salesforce data related to
  //       // opportunity object have failed so now launch form can not be made so form dikhaane ke jgah
  //       // show some error occured page
  //       console.error(
  //         "Error fetching Opportunity Details issssssss:",
  //         opportunityDataResponse.errorMsg
  //       );
  //     } else {
  //       console.log("acccccccccccc tookkkkk", accessToken);
  //       // Step2 : Save all the retrieve to db
  //       // Await all the asynchronous calls
  //       console.log("yooooooo !!!!!");
  //       await Promise.all([
  //         this.postOpportunityDetails(
  //           {
  //             jsonData: JSON.stringify({
  //               opportunity: opportunityDataResponse.opportunity,
  //               recordId: this.content.recordId
  //             })
  //           },
  //           accessToken
  //         ),
  //         this.postAccountDetails(
  //           {
  //             jsonData: JSON.stringify({
  //               account: opportunityDataResponse.account,
  //               recordId: this.content.recordId
  //             })
  //           },
  //           accessToken
  //         ),
  //         this.postContactDetails(
  //           {
  //             jsonData: JSON.stringify({
  //               contact: opportunityDataResponse.contacts,
  //               recordId: this.content.recordId
  //             })
  //           },
  //           accessToken
  //         ),
  //         this.postOwnerDetails(
  //           {
  //             jsonData: JSON.stringify({
  //               owner: opportunityDataResponse.owner,
  //               recordId: this.content.recordId
  //             })
  //           },
  //           accessToken
  //         )
  //       ]);

  //       // Step 3: attribute vs value kaa maapping add krna hai
  //       // templateName, orgId, templateVersion, templateType, contractFields[ { id, value} ];
  //       // step a. fetch template  ( templateId, orgId )
  //       // step b. get the mapping configuration (templateId, orgId)
  //       // step c. get all the data you want for the opportunity related record ( orgId, recordId )
  //       // step d. add logic to create the attribute vs value mapping and create launchForm entry

  //       // ************ CODING STARTS **************

  //       // step a.

  //       this.launchId = await createLaunchForm({
  //         templateId: this.content.templateId,
  //         recordId: this.content.recordId,
  //         accessToken: accessToken
  //       });

  //       console.log("this.launchId", this.launchId.replace(/"/g, ""));
  //       // Remove double quotes from this.launchId
  //       const launchIdWithoutQuotes = this.launchId.replace(/"/g, "");
  //       // this.iframeUrl = `http://localhost:8080/123/launch/${launchIdWithoutQuotes}`;
  //       // this.iframeUrl = `http://localhost:8080/123/launch/${launchIdWithoutQuotes}`;
  //       this.iframeUrl = `http://localhost:5173/newContract/external/launch/${launchIdWithoutQuotes}`;

  //       if (this.iframeUrl) {
  //         this.isLoading = false;
  //       }
  //     }
  //   }
  // }

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
      if (uploadResult.statusCode !== 200) {
        // abhi bhi launch form nhi bnn sakega so show message kii some error occured !!
      }
    } catch (error) {
      // abhi bhi launch form nhi bnn sakega so show message kii some error occured !!
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
      if (uploadResult.statusCode !== 200) {
        // abhi bhi launch form nhi bnn sakega so show message kii some error occured !!
      }
    } catch (error) {
      // abhi bhi launch form nhi bnn sakega so show message kii some error occured !!
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
      if (uploadResult.statusCode !== 200) {
        // abhi bhi launch form nhi bnn sakega so show message kii some error occured !!
      }
    } catch (error) {
      // abhi bhi launch form nhi bnn sakega so show message kii some error occured !!
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
      if (uploadResult.statusCode !== 200) {
        // abhi bhi launch form nhi bnn sakega so show message kii some error occured !!
      }
    } catch (error) {
      // abhi bhi launch form nhi bnn sakega so show message kii some error occured !!
      console.error("Error uploading Owner Details 44444:", error);
    }
  }
}
