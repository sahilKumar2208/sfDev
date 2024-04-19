public with sharing class UtilsController {
    // get currently logged in user's userId

      // Define a method to fetch currently logged in user's details from an external REST API
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getLoggedInUserDetails(String accessToken) {
        Map<String, Object> userDetails = new Map<String, Object>();

        // Make the callout to the external REST API
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://4d23-103-251-142-10.ngrok-free.app/api/v1/user');
        request.setMethod('GET');
        request.setHeader('Authorization', 'Bearer ' + accessToken); // 'authorization' should be 'Authorization'
        Http http = new Http();
        HttpResponse response = http.send(request);
        
        // Process the response
        if (response.getStatusCode() == 200) {
            // Parse JSON response and extract user details
            userDetails = (Map<String, Object>)JSON.deserializeUntyped(response.getBody()); // Deserialize JSON response
        } else {    
            // Handle error response
            // You may want to throw an exception or log the error
            System.debug('Error response status code: ' + response.getStatusCode());
            System.debug('Error response body: ' + response.getBody());
        }
        return userDetails;
    }


    //check if the current token is expired or not
}