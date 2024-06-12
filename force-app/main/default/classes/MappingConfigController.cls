public with sharing class MappingConfigController {

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> fetchMappingConfig(String accessToken, String templateId) {
        // Initialize the return map
        Map<String, Object> resultMap = new Map<String, Object>();

        String orgId = '65e7e5f72e7cd34c3ca25964';

        try {
            // Create the HTTP request
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://19f5-157-37-132-40.ngrok-free.app/api/v1/mapping/' + orgId + '/template/' + templateId); // Replace with the actual endpoint
            req.setMethod('GET');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('ngrok-skip-browser-warning', '69420');
            // Add authorization if needed
            req.setHeader('Authorization', 'Bearer ' + accessToken);

            // Send the request
            Http http = new Http();
            HttpResponse res = http.send(req);

            // Get the status code
            Integer statusCode = res.getStatusCode();
            resultMap.put('statusCode', statusCode);

            // Parse the JSON response
            if (statusCode == 200) {
                String responseBody = res.getBody();
                // Deserialize response to List<Object>
                List<Object> responseDataList = (List<Object>) JSON.deserializeUntyped(responseBody);
                // Convert List<Object> to List<Map<String, Object>>
                List<Map<String, Object>> responseData = new List<Map<String, Object>>();
                for (Object obj : responseDataList) {
                    responseData.add((Map<String, Object>) obj);
                }
                resultMap.put('data', responseData);
            } else {
                resultMap.put('data', null);
            }
        } catch (Exception e) {
            resultMap.put('statusCode', 500);
            resultMap.put('data', 'Error: ' + e.getMessage());
        }
        
        // Return the map with status code and data
        return resultMap;
    }

    // fetch the parent object reference name 
    @AuraEnabled(cacheable=true)
    public static String getParentReferenceName(String parent, String child) {
    String parentReferenceName = '';
    
    // Construct the API endpoint URL
    String apiEndpoint = 'https://19f5-157-37-132-40.ngrok-free.app/api/v1/salesforce-objects/parentName';
    
    // Create the request body
    String requestBody = '{"parent":"' + parent + '","child":"' + child + '"}';
    
    // Create an HTTP request
    Http http = new Http();
    HttpRequest request = new HttpRequest();
    request.setEndpoint(apiEndpoint);
    request.setMethod('POST');
    request.setHeader('Content-Type', 'application/json');
    request.setBody(requestBody);
    
    // Send the request and get the response
    HttpResponse response = http.send(request);
    
    // Check if the request was successful
    if (response.getStatusCode() == 200) {
        // Parse the JSON response
        Map<String, Object> responseData = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
        
        // Retrieve the parentReferenceName value
        parentReferenceName = (String)responseData.get('parentReferenceName');
    } else {
        // Handle error case
        System.debug('Error: ' + response.getStatusCode() + ' ' + response.getStatus());
    }

    System.debug('result, parentRefwerenceName is --->' + parentReferenceName);
    
    return parentReferenceName;
}
}