public with sharing class TemplateController {

    // Define a wrapper class for template options
    public class TemplateOption {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String value { get; set; }

        public TemplateOption(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    // Define a wrapper class for the response
    public class TemplateResponse {
        @AuraEnabled
        public Integer statusCode { get; set; }
        @AuraEnabled
        public List<TemplateOption> options { get; set; }
        @AuraEnabled
        public String message { get; set; }

        public TemplateResponse(Integer statusCode, List<TemplateOption> options, String message) {
            this.statusCode = statusCode;
            this.options = options;
            this.message = message;
        }
    }

    private static final String AUTHORIZATION_HEADER = 'authorization';

    // Define a method to fetch templates from the external REST API
    @AuraEnabled(cacheable=true)
    public static TemplateResponse getTemplates(String objectType, String accessToken) {
        List<TemplateOption> options = new List<TemplateOption>();
        Integer statusCode;
        String message;

        try {
            // Make the callout to the external REST API
            HttpRequest request = new HttpRequest();
            request.setEndpoint('https://a72b-103-251-142-10.ngrok-free.app/api/v1/mapping/65e7e5f72e7cd34c3ca25964/templates?objectType=' + objectType);
            request.setMethod('GET');
            request.setHeader(AUTHORIZATION_HEADER, 'Bearer ' + accessToken);
            Http http = new Http();
            HttpResponse response = http.send(request);

            statusCode = response.getStatusCode();
            System.debug('Response status code: ' + statusCode);
            System.debug('Response body: ' + response.getBody());

            // Process the response
            if (statusCode == 200) {
                // Parse JSON response and extract template options
                Map<String, Object> templateData = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());

                System.debug('Template data: ' + templateData);
                for (String templateId : templateData.keySet()) {
                    String templateName = (String) templateData.get(templateId);
                    options.add(new TemplateOption(templateName, templateId));
                }
                message = 'Templates retrieved successfully.';
            } else {
                // Handle error response
                System.debug('Error response status code: ' + statusCode);
                System.debug('Error response body: ' + response.getBody());
                message = 'Failed to retrieve templates.';
            }
        } catch (Exception e) {
            statusCode = 500; // Internal Server Error
            message = 'An error occurred while fetching templates: ' + e.getMessage();
            System.debug('Exception: ' + e.getMessage());
        }

        System.debug('Options data: ' + options);
        return new TemplateResponse(statusCode, options, message);
    }
}
