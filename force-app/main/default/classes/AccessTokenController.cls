//*********** this gives you token of cmt service ********************//

public with sharing class AccessTokenController {
    private static final String API_BASE_URL = 'https://cmt-backend-playground.intellosync.com/api/v1/users/login/viaAuthService';
    private static final String AUTHORIZATION_HEADER = 'Authorization';

    // Define a method to get the access token through REST API
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getAccessToken(String authServiceToken) {
        // Make the callout to the external REST API
        HttpRequest request = new HttpRequest();
        request.setEndpoint(API_BASE_URL);
        request.setMethod('GET');

        // Set the authorization header
        request.setHeader(AUTHORIZATION_HEADER, 'Bearer ' + authServiceToken);

        System.debug('authServiceToken is ---->' + authServiceToken);

        Http http = new Http();
        HttpResponse response;
        try {
            response = http.send(request);
        } catch(System.CalloutException e) {
            return generateResponse(500, null);
        }

        // Check if the callout was successful
        if (response.getStatusCode() == 200) {
            // Parse the response body to extract access token
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            Map<String, Object> data = (Map<String, Object>) responseBody.get('data');
            System.debug('data ----->'+ data.get('accessToken'));
            return generateResponse(200, (String)data.get('accessToken'));
        } else {
            // Handle error response
            System.debug('Error response: ' + response.getBody());
            return generateResponse(response.getStatusCode(), null);
        }
    }

    // Utility method to generate the response map
    private static Map<String, Object> generateResponse(Integer statusCode, String accessToken) {
        Map<String, Object> response = new Map<String, Object>();
        response.put('statusCode', statusCode);
        response.put('accessToken', accessToken);
        return response;
    }
}

