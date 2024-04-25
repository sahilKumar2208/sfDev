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


// Define a method to create a new intellosync_workflows__c record
@AuraEnabled
public static Integer createContractRecord(Map<String, Object> toolContractCreationResponse) {
    try {
        // Construct payload data for creating record
        Intellosync_workflow__c newRecord = new Intellosync_workflow__c(
            Name = toolContractCreationResponse.get('type') + ' - ' + toolContractCreationResponse.get('name'),
            IntelloSync_workflow_name__c = toolContractCreationResponse.get('type') + ' - ' + toolContractCreationResponse.get('name'),
            Intellosync_workflow_link__c = 'https://playground-contracts.intellosync.com/contract/' + toolContractCreationResponse.get('_id'),
            Intellosync_workflow_type__c = (String) toolContractCreationResponse.get('type'),
            Intellosync_workflow_id__c = (String) toolContractCreationResponse.get('_id')
            // Add other fields as needed
        );

        // Insert the new record
        insert newRecord;

        // Return HTTP status code 201 for success
        return 201;
    } catch (Exception e) {
        // Handle any exceptions and return HTTP status code 500 for failure
        return 500;
    }
}


}
