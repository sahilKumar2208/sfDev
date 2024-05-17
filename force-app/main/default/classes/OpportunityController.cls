public with sharing class OpportunityController {
  public OpportunityController() {
  }

  private static final String API_BASE_URL = 'https://a72b-103-251-142-10.ngrok-free.app/api/v1/salesforce/opportunity';
  private static final String AUTHORIZATION_HEADER = 'authorization';
  // TODO: Add orgId as input argument after authentication code

@AuraEnabled(cacheable=true)
public static Map<String, Object> uploadOpportunityDetails(String jsonData, String accessToken) {
    String apiUrl = API_BASE_URL;

    HttpRequest request = new HttpRequest();
    request.setEndpoint(apiUrl);
    request.setMethod('PUT');
    request.setBody(jsonData);
    request.setHeader('Content-Type', 'application/json');
    request.setHeader('ngrok-skip-browser-warning', '69420');
    request.setHeader(AUTHORIZATION_HEADER, 'Bearer ' + accessToken);

    Http http = new Http();

    try {
        HttpResponse response = http.send(request);

        if (response.getStatusCode() == 200) {
            Map<String, Object> responseData = new Map<String, Object>();
            responseData.put('statusCode', response.getStatusCode());
            responseData.put('responseBody', response.getBody());
            return responseData;
        } else {
            Map<String, Object> errorData = new Map<String, Object>();
            errorData.put('statusCode', response.getStatusCode());
            errorData.put('errorMessage', 'Error: ' + response.getStatus());
            return errorData;
        }
    } catch (Exception e) {
        Map<String, Object> exceptionData = new Map<String, Object>();
        exceptionData.put('statusCode', 500); // Internal Server Error
        exceptionData.put('errorMessage', 'Exception: ' + e.getMessage());
        return exceptionData;
    }
}

  @AuraEnabled(cacheable=true)
  public static OpportunityWrapper getOpportunityDetails(String opportunityId) {
    OpportunityWrapper result = new OpportunityWrapper();
    try {
      Opportunity opp = [
        SELECT
          Id,
          AccountId,
          Amount,
          CloseDate,
          ContractId,
          CreatedById,
          CurrentGenerators__c,
          DeliveryInstallationStatus__c,
          Description,
          ExpectedRevenue,
          ForecastCategoryName,
          LastModifiedById,
          LeadSource,
          MainCompetitors__c,
          NextStep,
          Name,
          OwnerId,
          IqScore,
          OrderNumber__c,
          Pricebook2Id,
          CampaignId,
          IsPrivate,
          Probability,
          TotalOpportunityQuantity,
          StageName,
          TrackingNumber__c,
          Type,
          Account.Name
        FROM Opportunity
        WHERE Id = :opportunityId
        LIMIT 1
      ];
      result.opportunity = opp;

      // Query related Account and its primary contact data
      Account acc = [
        SELECT
          Id,
          Name,
          AccountNumber,
          OwnerId,
          Site, 
          AccountSource,
          Active__c, 
          AnnualRevenue,
          BillingAddress,
          CleanStatus,
          CreatedById, 
          CustomerPriority__c,
          DandbCompanyId,
          DunsNumber,
          Jigsaw,
          Description,
          Tier, 
          NumberOfEmployees,
          Fax,
          Industry,
          LastModifiedById,
          NaicsCode,
          NaicsDesc,
          NumberofLocations__c,
          OperatingHoursId,
          Ownership,
          ParentId,
          Phone,
          Rating,
          ShippingAddress,
          Sic, 
          SicDesc, 
          SLA__c, 
          SLAExpirationDate__c, 
          SLASerialNumber__c, 
          TickerSymbol, 
          Tradestyle, 
          Type, 
          UpsellOpportunity__c, 
          Website, 
          YearStarted 
        FROM Account
        WHERE Id = :opp.AccountId
        LIMIT 1
      ];
      result.account = acc;

      // Query related Contacts
      List<Contact> contacts = [
        SELECT
          Id,
          AccountId,
          AssistantName,
          AssistantPhone,
          Birthdate,
          CleanStatus,
          OwnerId,
          CreatedById,
          Jigsaw,
          Department,
          Description,
          DoNotCall,
          Email,
          HasOptedOutOfEmail,
          Fax,
          HasOptedOutOfFax,
          GenderIdentity,
          HomePhone,
          IndividualId,
          Languages__c,
          LastModifiedById,
          LastCURequestDate,
          LastCUUpdateDate,
          LeadSource,
          Level__c,
          MailingAddress,
          MobilePhone,
          Name,
          Salutation,
          FirstName,
          LastName,
          OtherAddress,
          OtherPhone,
          Phone,
          Pronouns,
          ReportsToId,
          Title
        FROM Contact
        WHERE AccountId = :opp.AccountId // se yahan account id se contacts nikaala jaa rha 
        // which mean kii ek account ke saarey contact laa ke dega ye which will be an array
        ORDER BY CreatedDate
        LIMIT 1
      ];
      result.contacts = contacts.isEmpty() ? null : contacts[0];

      // Query related Owner
      User owner = [
        SELECT
        AboutMe, 
        IsActive, 
        Address, 
        ReceivesAdminInfoEmails, 
        Alias, 
        ForecastEnabled, 
        CallCenterId, 
        DigestFrequency, 
        CompanyName, 
        ContactId, 
        JigsawImportLimitOverride, 
        DefaultGroupNotificationFrequency, 
        DelegatedApproverId, 
        Department, 
        Division, 
        EmailEncodingKey, 
        SenderEmail, 
        SenderName, 
        Signature, 
        Extension, 
        Fax, 
        IsProfilePhotoActive, 
        IndividualId, 
        ReceivesInfoEmails, 
        LanguageLocaleKey, 
        LocaleSidKey, 
        ManagerId, 
        MobilePhone, 
        Name, 
        FirstName, 
        LastName, 
        CommunityNickname, 
        OutOfOfficeMessage, 
        Phone, 
        ProfileId, 
        UserRoleId, 
        FederationIdentifier, 
        IsExtIndicatorVisible, 
        StayInTouchNote, 
        StayInTouchSignature,
        StayInTouchSubject, 
        TimeZoneSidKey, 
        Title, 
        MediumBannerPhotoUrl, 
        BannerPhotoUrl, 
        SmallBannerPhotoUrl, 
        MediumPhotoUrl, 
        Username 
        FROM User
        WHERE Id = :opp.OwnerId
        LIMIT 1
      ];
      result.owner = owner;
      result.statusCode = 200;
    } catch (Exception e) {
      System.debug('Error in getOpportunityDetails: ' + e.getMessage()); // Log error message
      result.errorMsg = e.getMessage();
      result.statusCode = 500; 
    }
    System.debug('Returning result: ' + result); // Log result before returning
    return result;
  }

public class OpportunityWrapper {
    @AuraEnabled
    public Opportunity opportunity;
    @AuraEnabled
    public Account account;
    @AuraEnabled
    public Contact contacts;
    @AuraEnabled
    public User owner;
    @AuraEnabled
    public String errorMsg;
    @AuraEnabled
    public Integer statusCode;
}
}
