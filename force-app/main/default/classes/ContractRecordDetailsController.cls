public with sharing class ContractRecordDetailsController {
    
    // Define a method to fetch details of the intellosync_workflows__c record
    @AuraEnabled(cacheable=true)
    public static Intellosync_workflow__c getContractRecordDetails(String recordId) {
        // Declare a variable to store the record details
        Intellosync_workflow__c workflowDetails;
        
        try {
            // Query the intellosync_workflows__c record using SOQL
            workflowDetails =
            [SELECT 
            Id, 
            Intellosync_workflow_id__c, 
            Intellosync_workflow_link__c, 
            Intellosync_workflow_name__c,
            Name,
            Intellosync_workflow_stage__c,
            Intellosync_workflow_type__c,
            LastModifiedById,
            Opportunity__c,
            OwnerId
            FROM Intellosync_workflow__c WHERE Id = :recordId LIMIT 1];
            
            // Check if the record was found
            if (workflowDetails != null) {
                // Return the record details
                return workflowDetails;
            } else {
                // Handle the case where the record is not found
                throw new AuraHandledException('Record not found.');
            }
        } catch (Exception e) {
            // Handle any exceptions and return null
            throw new AuraHandledException('Error fetching record details: ' + e.getMessage());
        }
    }
}
