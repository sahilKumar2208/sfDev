public with sharing class LaunchFormController {
    private static final String API_BASE_URL = 'https://a72b-103-251-142-10.ngrok-free.app/api/v1/launchForm/salesforce';

    // TODO: Add orgId as input argument after authentication code

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> createLaunchForm(String accessToken, String launchFormDataStr) {
        System.debug('launchform string is --->' + launchFormDataStr);
        System.debug('access token is ----->' + accessToken);
        String apiUrl = API_BASE_URL;
        HttpRequest request = new HttpRequest();
        request.setEndpoint(apiUrl);
        request.setMethod('POST');

        // Deserialize the launchFormData string into a map
        Map<String, Object> launchFormData = (Map<String, Object>) JSON.deserializeUntyped(launchFormDataStr);

        // Create the request body map
        Map<String, Object> requestBody = new Map<String, Object>();

        // Merge the launchFormData map with the requestBody map
        requestBody.putAll(launchFormData);

        String requestBodyJson = JSON.serialize(requestBody);
        request.setBody(requestBodyJson);
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('ngrok-skip-browser-warning', '69420');
        request.setHeader('authorization', 'Bearer ' + accessToken);

        Http http = new Http();
        Map<String, Object> responseMap = new Map<String, Object>();

        try {
            HttpResponse response = http.send(request);
            responseMap.put('statusCode', response.getStatusCode());
            if (response.getStatusCode() == 200) {
                responseMap.put('data', response.getBody());
            } else {
                responseMap.put('error', 'Error: ' + response.getStatus());
            }
        } catch (Exception e) {
            responseMap.put('statusCode', 500);
            responseMap.put('error', 'Exception: ' + e.getMessage());
        }

        return responseMap;
    }
}
