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

    private static final String AUTHORIZATION_HEADER = 'authorization';

    // Define a method to fetch templates from the external REST API
    @AuraEnabled(cacheable=true)
    public static List<TemplateOption> getTemplates(String objectType, String accessToken) {
        List<TemplateOption> options = new List<TemplateOption>();
        
        // Make the callout to the external REST API
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://a72b-103-251-142-10.ngrok-free.app/api/v1/mapping/65e7e5f72e7cd34c3ca25964/templates?objectType=Opportunity');
        request.setMethod('GET');
        request.setHeader(AUTHORIZATION_HEADER, 'Bearer ' + accessToken);
        Http http = new Http();
        HttpResponse response = http.send(request);

        System.debug('Response status code: ' + response.getStatusCode());
        System.debug('Response body: ' + response.getBody());
        
        // Process the response
        if (response.getStatusCode() == 200) {
            // Parse JSON response and extract template options
            Map<String, Object> templateData = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());

            System.debug('Template data: ' + templateData);
            for (String templateId : templateData.keySet()) {
                String templateName = (String) templateData.get(templateId);
                options.add(new TemplateOption(templateName, templateId));
            }
        } else {    
            // Handle error response
            // You may want to throw an exception or log the error
            System.debug('Error response status code: ' + response.getStatusCode());
            System.debug('Error response body: ' + response.getBody());
        }
        System.debug('Options data: ' + options);
        return options;
    }
}
