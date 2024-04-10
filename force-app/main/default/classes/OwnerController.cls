public with sharing class OwnerController {
  public OwnerController() {
  }

  private static final String API_BASE_URL = 'https://4d23-103-251-142-10.ngrok-free.app/api/v1/salesforce/owner';

  // TODO: Add orgId as input argument after authentication code

  @AuraEnabled(cacheable=true)
  public static String uploadOwnerDetails(String jsonData) {
    String apiUrl = API_BASE_URL;

    HttpRequest request = new HttpRequest();

    request.setEndpoint(apiUrl);
    request.setMethod('PUT');

    request.setBody(jsonData);

    request.setHeader('Content-Type', 'application/json');
    request.setHeader('ngrok-skip-browser-warning', '69420');

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