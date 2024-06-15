/* FLOW OF THE CODE  */

/*
Start
 |
 |-- connectedCallback()
 |   |
 |   |-- retrieveOrFetchToken()
 |   |    |
 |   |    |-- Check localStorage for token
 |   |    |-- If token exists, use it
 |   |    |-- Else, call getAccessToken()
 |   |           |
 |   |           |-- Store retrieved token in localStorage
 |   |
 |   |-- createLaunchForm()
 |        |
 |        |-- fetchMappingConfig()
 |        |
 |        |-- getAttributeValueMap()
 |        |    |
 |        |    |-- Loop through mappingConfigData
 |        |    |-- For each entry, call getLeafFieldValue()
 |        |    |-- Transform Salesforce data if necessary
 |        |
 |        |-- constructLaunchFormData()
 |        |
 |        |-- createLaunchForm() API call
 |        |    |
 |        |    |-- Set iframeUrl
 |        |
 |        |-- Set isLoading to false
 |
 |-- renderedCallback()
 |   |
 |   |-- applyModalStyling()
 |   |
 |   |-- Add event listener for "message"
 |
 |-- Event: message received
 |   |
 |   |-- handleMessageFromReactApp()
 |        |
 |        |-- Process event data
 |        |-- createContractRecord() API call
 |        |-- Post message back to source
 |
 |-- disconnectedCallback()
 |   |
 |   |-- Remove event listener for "message"
 |
 |-- handleOkay()
 |   |
 |   |-- Close modal with "okay"
End
*/

import { api, track } from "lwc";
import LightningModal from "lightning/modal";
import createLaunchForm from "@salesforce/apex/LaunchFormController.createLaunchForm";
import getAccessToken from "@salesforce/apex/AccessTokenController.getAccessToken";
import createContractRecord from "@salesforce/apex/ContractRecordDetailsController.createContractRecord";
import getSFObjectId from "@salesforce/apex/DynamicQueryController.getSFObjectId";
import getFieldValue from "@salesforce/apex/DynamicQueryController.getFieldValue";
import fetchMappingConfig from "@salesforce/apex/MappingConfigController.fetchMappingConfig";
import getExpiryTime from "@salesforce/apex/JwtDecoder.getExpiryTime";

export default class LaunchPageModal extends LightningModal {
  @api content;
  @track iframeUrl;
  @track isLoading = true;
  @track hasError = false;
  @track hasMappingError = false;

  launchId;
  cmtToken;

  async connectedCallback() {
    console.log("Connected callback of modal is called");

    console.log("connnntentt", this.content);

    const authToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaGlsLmt1bWFyQGludGVsbG9zeW5jLmNvbSIsImlhdCI6MTcxNTc3ODI1NSwiZXhwIjoxNzQ3MzM1ODU1fQ.n5mjllU-DbplgTSiQUsNBnMCXOUtHX-eeAudcr-rOoQ";
    this.cmtToken = await this.retrieveOrFetchToken(authToken);

    await this.createLaunchForm();
  }

  renderedCallback() {
    this.applyModalStyling();
    window.addEventListener("message", this.handleMessageFromReactApp);
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.handleMessageFromReactApp);
  }

  async retrieveOrFetchToken(authToken) {
    let cmtToken = localStorage.getItem("accessToken");

    let expTime;

    if (cmtToken) {
      expTime = await getExpiryTime({ jwtToken: cmtToken });
    }

    const currTime = Date.now();

    const hasExpired = currTime - expTime > 0 ? true : false;

    if (!cmtToken || (cmtToken && hasExpired)) {
      const cmtTokenResponse = await getAccessToken({
        authServiceToken: authToken
      });
      if (cmtTokenResponse.statusCode === 200) {
        cmtToken = cmtTokenResponse.accessToken;
        localStorage.setItem("accessToken", cmtToken);
      } else {
        console.error("Authorization failed with the given token.");
        this.hasError = true;
      }
    }
    return cmtToken;
  }

  applyModalStyling() {
    const STYLE = document.createElement("style");
    STYLE.innerText = `.slds-modal_large .slds-modal__container{
      width: 98%;
      max-width: none;
      min-width: 40rem;}`;
    this.template.querySelector("lightning-modal-body").appendChild(STYLE);
  }

  async handleMessageFromReactApp(event) {
    try {
      const data = event.data;
      const response = await createContractRecord({
        toolContractCreationResponse: data.contractCreationResponse
      });
      if (response === 201) {
        event.source.postMessage("job-done", "*");
      } else {
        event.source.postMessage("job-failed", "*");
      }
    } catch (error) {
      console.error("Error creating contract record:", error);
    }
  }

  async createLaunchForm() {
    const mappingConfig = await fetchMappingConfig({
      accessToken: this.cmtToken,
      templateId: this.content.templateId
    });

    const attributeValueMap = await this.getAttributeValueMap(
      mappingConfig.data
    );
    const launchFormData = this.constructLaunchFormData(
      mappingConfig.data[0],
      attributeValueMap
    );

    const createLaunchFormResponse = await createLaunchForm({
      accessToken: this.cmtToken,
      launchFormDataStr: JSON.stringify(launchFormData)
    });

    if (createLaunchFormResponse.statusCode === 200) {
      console.log("launch form creation status ----> 200");
      this.launchId = createLaunchFormResponse.data;
      this.setIframeUrl(this.launchId);
    } else {
      console.log(
        "error in creating launch form --->",
        createLaunchFormResponse.error
      );
      this.isLoading = false;
      this.hasError = true;
    }
  }

  async getAttributeValueMap(mappingConfigData) {
    const attributeValueMap = {};

    for (const entry of mappingConfigData) {
      const salesforceFieldValue = await this.getLeafFieldValue(entry);
      console.log("sf route leaf field value ", salesforceFieldValue);
      attributeValueMap[entry.templateAttributeId] =
        this.transformSalesforceData(
          salesforceFieldValue,
          entry.externalSystemAttributeType
        );
    }

    return attributeValueMap;
  }

  constructLaunchFormData(mapping, attributeValueMap) {
    return {
      platform: "salesforce",
      templateId: this.content.templateId,
      templatename: mapping.templateName,
      templateType: mapping.contractType,
      templateVersion: mapping.templateVersion,
      contractFields: this.processData(attributeValueMap)
    };
  }

  setIframeUrl(launchId) {
    const launchIdWithoutQuotes = launchId.replace(/"/g, "");
    this.iframeUrl = `http://localhost:5173/newContract/external/launch/${launchIdWithoutQuotes}`;
    console.log("final iframe url --->", this.iframeUrl);
    this.isLoading = false;
  }

  transformSalesforceData(salesforceFieldValue, externalSystemAttributeType) {
    if (externalSystemAttributeType === "Address") {
      return {
        addressLine1: salesforceFieldValue.street,
        city: salesforceFieldValue.city,
        state: salesforceFieldValue.state,
        postCode: salesforceFieldValue.postalCode,
        country: salesforceFieldValue.country
      };
    } else if (externalSystemAttributeType === "Date") {
      // when externalSystemAttributeType === Date/Time then also this will run
      return new Date(salesforceFieldValue).getTime();
    } else if (externalSystemAttributeType === "DateTime") {
      // handle this case
    } else if (externalSystemAttributeType === "Time") {
      // handle this case
    }
    return salesforceFieldValue;
  }

  processData(data) {
    const newData = {};

    for (const key in data) {
      const parts = key.split(".");
      if (parts.length === 1) {
        newData[parts[0]] = data[key];
      } else {
        const [fieldName, ...nestedFieldNameParts] = parts;
        const nestedFieldName = nestedFieldNameParts.join(".");

        if (!newData[fieldName]) {
          newData[fieldName] = {};
        }

        newData[fieldName][nestedFieldName] = data[key];
      }
    }

    return newData;
  }

  async getLeafFieldValue(entry) {
    const sourceObject = entry.salesforce.launchObjectType;
    const relatedObjectsData = entry.salesforce.relatedObjects;

    const isDirectMapping = relatedObjectsData.length === 0;
    const leafObject = isDirectMapping
      ? sourceObject
      : relatedObjectsData[relatedObjectsData.length - 1].objectName;
    const leafField = entry.externalSystemAttributeName;

    const relatedObjectsIds = isDirectMapping
      ? []
      : await this.retrieveObjectIds(
          sourceObject,
          relatedObjectsData,
          this.content.recordId
        );
    const leafObjectId = isDirectMapping
      ? this.content.recordId
      : relatedObjectsIds[relatedObjectsIds.length - 1].replace(/"/g, "");

    const fieldValue = await getFieldValue({
      field: leafField,
      objectName: leafObject,
      condition: `Id = '${leafObjectId}'`
    });

    return fieldValue[0][leafField];
  }

  async retrieveObjectIds(sourceObject, relatedObjectsData, knownRecordId) {
    const relatedObjectsIds = [knownRecordId];
    let knownId = knownRecordId;

    relatedObjectsData = [{ objectName: sourceObject }, ...relatedObjectsData];

    for (let i = 0; i < relatedObjectsData.length - 1; i++) {
      const objectData1 = relatedObjectsData[i];
      const objectData2 = relatedObjectsData[i + 1];
      const referenceFieldName = objectData2.referenceFieldName;

      // filtering and sorting
      let { filterConditions, sortingField, sortingOrder } = objectData2;
      // Check filter conditions
      let filterConditionObj2 = filterConditions?.length
        ? filterConditions
        : null;

      let filterCondition = filterConditionObj2
        ? `${filterConditionObj2[0]?.fieldName} = '${filterConditionObj2[0]?.fieldValue}'`
        : null;

      // Check sorting conditions
      let sortingConditionObj2 =
        sortingField !== undefined && sortingOrder !== undefined
          ? { sortingField, sortingOrder }
          : null;

      let sortingCondition = sortingConditionObj2
        ? `${sortingConditionObj2.sortingField} ${sortingConditionObj2.sortingOrder}`
        : null;

      if (objectData2.isChild) {
        const dynamicQueryResult = await this.fetchSFObjectId(
          "Id",
          objectData2.objectName,
          `${referenceFieldName} = '${knownId}'`,
          filterCondition,
          sortingCondition
        );

        console.log("abxy", dynamicQueryResult);

        if (dynamicQueryResult.length === 0) {
          console.log("I am an error !!!");
          // means the query didn't returned anything!!
          this.isLoading = false;
          this.hasMappingError = true; // or show in UI that there is some error in the mapping.
          throw new Error("Mapping error: query returned no results.");
        }

        relatedObjectsIds.push(dynamicQueryResult[0]["Id"]);
        knownId = dynamicQueryResult[0]["Id"];
      } else {
        const dynamicQueryResult = await this.fetchSFObjectId(
          referenceFieldName,
          objectData1.objectName,
          `Id = '${knownId}'`,
          filterCondition,
          sortingCondition
        );

        if (dynamicQueryResult.length === 0) {
          // means the query didn't returned anything!!
          this.hasError = true; // or show in UI that there is some error in the mapping.
        }
        relatedObjectsIds.push(dynamicQueryResult[0][referenceFieldName]);
        knownId = dynamicQueryResult[0][referenceFieldName];
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
      return await getSFObjectId({
        field,
        objectName,
        mandatoryCondition,
        filterCondition,
        sortingCondition
      });
    } catch (error) {
      console.error("Error fetching SF object ID:", error);
      throw error;
    }
  }

  handleOkay() {
    this.close("okay");
  }
}
