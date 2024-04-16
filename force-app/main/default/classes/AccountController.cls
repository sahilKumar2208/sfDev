public with sharing class AccountController {
    public AccountController() {

    }

        private static final String API_BASE_URL = 'https://4d23-103-251-142-10.ngrok-free.app/api/v1/salesforce/account';

    // TODO: Add orgId as input argument after authentication code

    @AuraEnabled(cacheable=true)
    public static String uploadAccountDetails(String jsonData, String accessToken) {

        String apiUrl = API_BASE_URL;

        HttpRequest request = new HttpRequest();

        request.setEndpoint(apiUrl);
        request.setMethod('PUT');

        request.setBody(jsonData);

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