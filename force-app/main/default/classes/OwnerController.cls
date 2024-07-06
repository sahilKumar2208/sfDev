public with sharing class OwnerController {
    public OwnerController() {
    }

    private static final String API_BASE_URL = 'https://c40b-103-251-142-10.ngrok-free.app/api/v1/salesforce/owner';

    // TODO: Add orgId as input argument after authentication code

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> uploadOwnerDetails(String jsonData, String accessToken) {
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
                Map<String, Object> responseData = new Map<String, Object>();
                responseData.put('statusCode', response.getStatusCode());
                responseData.put('responseBody', response.getBody());
                return responseData;
            } else {
                Map<String, Object> errorData = new Map<String, Object>();
                errorData.put('statusCode', response.getStatusCode());
                errorData.put('errorMessage', 'Error: ' + response.getStatus());
                return errorData;
            }
        } catch (Exception e) {
            Map<String, Object> exceptionData = new Map<String, Object>();
            exceptionData.put('statusCode', 500); // Internal Server Error
            exceptionData.put('errorMessage', 'Exception: ' + e.getMessage());
            return exceptionData;
        }
    }
}
