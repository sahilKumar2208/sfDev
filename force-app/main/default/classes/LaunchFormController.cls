public with sharing class LaunchFormController {
    private static final String API_BASE_URL = 'https://4d23-103-251-142-10.ngrok-free.app/api/v1/launchForm/salesforce';

    public LaunchFormController() {
        // Constructor
    }

    // TODO: Add orgId as input argument after authentication code

    @AuraEnabled(cacheable=true)
    public static String createLaunchForm(String templateId, String recordId, String accessToken) {
        System.debug('templateId is --->' + templateId);
        System.debug('recordId is ----->' + recordId);

        String apiUrl = API_BASE_URL;

        HttpRequest request = new HttpRequest();

        request.setEndpoint(apiUrl);
        request.setMethod('POST');

        // Set the request body
        Map<String, String> requestBody = new Map<String, String>();
        requestBody.put('templateId', templateId);
        requestBody.put('recordId', recordId);
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