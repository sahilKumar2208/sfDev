public with sharing class ContractDetailsController {

    @AuraEnabled(cacheable=true)
    public static ResponseWrapper getWorkflowDetails(String workflowId, String accessToken) {
        ResponseWrapper responseWrapper = new ResponseWrapper();
        
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
        responseWrapper.statusCode = response.getStatusCode();
        if (response.getStatusCode() == 200) {
            // Parse JSON response and extract template options
            responseWrapper.body = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            System.debug('Workflow Details: ' + responseWrapper.body);
        } else {    
            // Handle error response
            responseWrapper.body = new Map<String, Object>{
                'error' => 'Error response status code: ' + response.getStatusCode() + ', ' + response.getBody()
            };
            System.debug('Error response status code: ' + response.getStatusCode());
            System.debug('Error response body: ' + response.getBody());
        }
        return responseWrapper;
    }

    // @AuraEnabled(cacheable=true)
    @AuraEnabled
    public static ResponseWrapper getContractDetails(String contractId, String accessToken) {
        ResponseWrapper responseWrapper = new ResponseWrapper();

        // Make the callout to the external REST API
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://cmt-backend-playground.intellosync.com/api/v1/contracts/' + contractId);
        // request.setEndpoint('https://9a0e-103-251-142-10.ngrok-free.app/api/v1/contracts/' + contractId);

        request.setMethod('GET');
        request.setHeader('authorization', 'Bearer ' + accessToken);
        Http http = new Http();
        HttpResponse response = http.send(request);

        System.debug('Response status code: ' + response.getStatusCode());
        System.debug('Response body: ' + response.getBody());
        
        // Process the response
        responseWrapper.statusCode = response.getStatusCode();
        if (response.getStatusCode() == 200) {
            // Parse JSON response and extract template options
            responseWrapper.body = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            System.debug('Contract Details: ' + responseWrapper.body);
        } else {    
            // Handle error response
            responseWrapper.body = new Map<String, Object>{
                'error' => 'Error response status code: ' + response.getStatusCode() + ', ' + response.getBody()
            };
            System.debug('Error response status code: ' + response.getStatusCode());
            System.debug('Error response body: ' + response.getBody());
        }
        return responseWrapper;
    }

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

    @AuraEnabled
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
            responseWrapper.statusCode = response.getStatusCode();
            if (response.getStatusCode() == 200) {
                responseWrapper.body = (List<Object>) JSON.deserializeUntyped(response.getBody());
            } else {
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

    @AuraEnabled(cacheable=true)
    public static ResponseWrapper approveContract(String contractId, String accessToken) {
        ResponseWrapper responseWrapper = new ResponseWrapper();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://cmt-backend-playground.intellosync.com/api/v1/contracts/' + contractId + '/approvers/Approved');
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('authorization', 'Bearer ' + accessToken);
        Http http = new Http();
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
        @AuraEnabled public Object body;
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
