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

    // download document function
    @AuraEnabled(cacheable=true)
    public static DownloadResponseWrapper downloadDocument(String storageDocumentId, String accessToken) {
        DownloadResponseWrapper responseWrapper = new DownloadResponseWrapper();
        
        // Make the callout to the external REST API
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://cmt-backend-playground.intellosync.com/api/v1/contracts/' + storageDocumentId + '/downloadDoc');
        request.setMethod('GET');
        request.setHeader('authorization', 'Bearer ' + accessToken);
        Http http = new Http();
        HttpResponse response = http.send(request);

        // Process the response
        responseWrapper.statusCode = response.getStatusCode();
        if (response.getStatusCode() == 200) {
            // Parse JSON response and extract template options
            responseWrapper.body = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
        } else {    
            // Handle error response
            responseWrapper.body = new Map<String, Object>{
                'error' => 'Error response status code: ' + response.getStatusCode() + ', ' + response.getBody()
            };
        }
        return responseWrapper;
    }

@AuraEnabled(cacheable=true)
public static ApiResponseWrapper getContractDocumentsDetails(String contractId, String accessToken) {
    ApiResponseWrapper responseWrapper = new ApiResponseWrapper();

    try {
        // Create a new HTTP request
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://cmt-backend-playground.intellosync.com/api/v1/document/contract/' + contractId);
        request.setMethod('GET');
        request.setHeader('authorization', 'Bearer ' + accessToken);

        // Create a new HTTP instance
        Http http = new Http();

        // Send the HTTP request
        HttpResponse response = http.send(request);

        // Check the response status code
        if (response.getStatusCode() == 200) {
            responseWrapper.statusCode = 200;
            responseWrapper.body = (List<Object>) JSON.deserializeUntyped(response.getBody());
        } else {
            responseWrapper.statusCode = response.getStatusCode();
            responseWrapper.body = new List<Object>{
                new Map<String, Object>{
                    'error' => 'HTTP Status Code: ' + response.getStatusCode() + ', Response Body: ' + response.getBody()
                }
            };
        }
    } catch (Exception e) {
        responseWrapper.statusCode = 500; // Internal Server Error
        responseWrapper.body = new List<Object>{
            new Map<String, Object>{
                'error' => 'Exception: ' + e.getMessage()
            }
        };
    }

    return responseWrapper;
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

public class ApiResponseWrapper {
    @AuraEnabled public Integer statusCode;
    @AuraEnabled public List<Object> body;
}

public class DownloadResponseWrapper {
    @AuraEnabled public Integer statusCode;
    @AuraEnabled public Map<String, Object> body;
}

}