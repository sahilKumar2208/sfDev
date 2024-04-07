public with sharing class OpportunityController {
  public OpportunityController() {
  }

  private static final String API_BASE_URL = 'https://5917-2409-4050-db0-91af-a429-c6f2-bdba-f7b1.ngrok-free.app/api/v1/salesforce/opportunity';

  // TODO: Add orgId as input argument after authentication code

  @AuraEnabled(cacheable=true)
  public static String uploadOpportunityDetails(String jsonData) {
    String apiUrl = API_BASE_URL;

    HttpRequest request = new HttpRequest();

    request.setEndpoint(apiUrl);
    request.setMethod('PUT');

    request.setBody(jsonData);

    request.setHeader('Content-Type', 'application/json');
    request.setHeader('ngrok-skip-browser-warning', '69420');

    Http http = new Http();

    try {
      HttpResponse response = http.send(request);

      if (response.getStatusCode() == 200) {
        return response.getBody();
      } else {
        System.debug('Error: ' + response.getStatus());
        return 'Error: ' + response.getStatus();
      }
    } catch (Exception e) {
      System.debug('Exception: ' + e.getMessage());
      return 'Exception: ' + e.getMessage();
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
          Industry,
          AnnualRevenue,
          NumberOfEmployees,
          BillingCity,
          BillingCountry,
          BillingState,
          BillingStreet,
          BillingPostalCode,
          Type,
          ShippingAddress,
          Rating,
          Fax,
          CustomerPriority__c,
          OwnerId
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
        WHERE AccountId = :opp.AccountId
        ORDER BY CreatedDate
        LIMIT 1
      ];
      result.contacts = contacts.isEmpty() ? null : contacts[0];

      // Query related Owner
      User owner = [
        SELECT
          Id,
          Name,
          Email,
          Phone,
          Title,
          Department,
          Address,
          CompanyName,
          FirstName,
          LastName,
          Username,
          MobilePhone,
          Fax,
          Extension,
          Signature,
          SenderName,
          SenderEmail,
          EmailEncodingKey,
          Division
        FROM User
        WHERE Id = :opp.OwnerId
        LIMIT 1
      ];
      result.owner = owner;
    } catch (Exception e) {
      System.debug('Error in getOpportunityDetails: ' + e.getMessage()); // Log error message
      result.errorMsg = e.getMessage();
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
  }
}
