public with sharing class UtilsController {
    // Define a wrapper class for the response
    public class UserResponse {
        @AuraEnabled
        public Integer statusCode;
        @AuraEnabled
        public Map<String, Object> userDetails;

        public UserResponse(Integer statusCode, Map<String, Object> userDetails) {
            this.statusCode = statusCode;
            this.userDetails = userDetails;
        }
    }

    // Define a method to fetch currently logged in user's details from an external REST API
    @AuraEnabled(cacheable=true)
    public static UserResponse getLoggedInUserDetails(String accessToken) {
        // Make the callout to the external REST API
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://19f5-157-37-132-40.ngrok-free.app/api/v1/user');
        request.setMethod('GET');
        request.setHeader('Authorization', 'Bearer ' + accessToken); // 'authorization' should be 'Authorization'
        Http http = new Http();
        HttpResponse response = http.send(request);

        // Process the response
        Integer statusCode = response.getStatusCode();
        Map<String, Object> userDetails = new Map<String, Object>();

        if (statusCode == 200) {
            // Parse JSON response and extract user details
            userDetails = (Map<String, Object>) JSON.deserializeUntyped(response.getBody()); // Deserialize JSON response
        } else {    
            // Handle error response
            // You may want to throw an exception or log the error
            System.debug('Error response status code: ' + statusCode);
            System.debug('Error response body: ' + response.getBody());
        }

        return new UserResponse(statusCode, userDetails);
    }

    //check if the current token is expired or not
}
