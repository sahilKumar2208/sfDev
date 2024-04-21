public with sharing class ContractDetailsController {

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getWorkflowDetails(String workflowId, String accessToken) {
        Map<String, Object> workflowDetails;

        // callout to the external rest api
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://cmt-backend-playground.intellosync.com/api/v1/workflow/' + workflowId);
        request.setMethod('GET');
        request.setHeader('authorization', 'Bearer ' + accessToken);
        Http http = new Http();
        HttpResponse response = http.send(request);

        System.debug('Response status code: ' + response.getStatusCode());
        System.debug('Response body: ' + response.getBody());
        
        // Process the response
        if (response.getStatusCode() == 200) {
            // Parse JSON response and extract template options
            workflowDetails = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());

            System.debug('Workflow Details: ' + workflowDetails);
        } else {    
            // Handle error response
            // You may want to throw an exception or log the error
            System.debug('Error response status code: ' + response.getStatusCode());
            System.debug('Error response body: ' + response.getBody());
        }
        return workflowDetails;
    }

    // Define a method to fetch templates from the external REST API
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getContractDetails(String contractId, String accessToken) {

         Map<String, Object> contractDetails;

        // Make the callout to the external REST API
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://cmt-backend-playground.intellosync.com/api/v1/contracts/' + contractId);
        request.setMethod('GET');
        request.setHeader('authorization', 'Bearer ' + accessToken);
        Http http = new Http();
        HttpResponse response = http.send(request);

        System.debug('Response status code: ' + response.getStatusCode());
        System.debug('Response body: ' + response.getBody());
        
        // Process the response
        if (response.getStatusCode() == 200) {
            // Parse JSON response and extract template options
            contractDetails = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());

            System.debug('Contract Details: ' + contractDetails);
        } else {    
            // Handle error response
            // You may want to throw an exception or log the error
            System.debug('Error response status code: ' + response.getStatusCode());
            System.debug('Error response body: ' + response.getBody());
        }
        return contractDetails;
    }


 // approval request 
@AuraEnabled(cacheable=true)
public static ResponseWrapper approveContract(String contractId, String accessToken) {
    HttpRequest request = new HttpRequest();
    request.setEndpoint('https://cmt-backend-playground.intellosync.com/api/v1/contracts/' + contractId + '/approvers/Approved');
    request.setMethod('POST');
    request.setHeader('Content-Type', 'application/json');
    request.setHeader('authorization', 'Bearer ' + accessToken);
    Http http = new Http();
    ResponseWrapper responseWrapper = new ResponseWrapper();
    try {
        HttpResponse response = http.send(request);
        responseWrapper.statusCode = response.getStatusCode();
        responseWrapper.body = response.getBody();
    } catch (Exception e) {
        responseWrapper.statusCode = 500; // Internal Server Error
        responseWrapper.body = 'Exception: ' + e.getMessage();
    }
    return responseWrapper;
}

public class ResponseWrapper {
    @AuraEnabled public Integer statusCode;
    @AuraEnabled public String body;
}

}