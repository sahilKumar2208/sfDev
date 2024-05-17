public with sharing class LaunchFormController {
    private static final String API_BASE_URL = 'https://a72b-103-251-142-10.ngrok-free.app/api/v1/launchForm/salesforce';

    public LaunchFormController() {
        // Constructor
    }

    // TODO: Add orgId as input argument after authentication code

@AuraEnabled(cacheable=true)
public static String createLaunchForm(String accessToken, String launchFormDataStr) {
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
}