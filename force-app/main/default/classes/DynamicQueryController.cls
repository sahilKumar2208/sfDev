public with sharing class DynamicQueryController {
   // create a function that will take in _PLACE_HOLDER_1_, _PLACE_HOLDER_2_, _PLACE_HOLDER_3_ and construct this query
   // SELECT _PLACE_HOLDER_1_ FROM _PLACE_HOLDER_2_ WHERE _PLACE_HOLDER_3_
   // and return the result of the query
   @AuraEnabled(cacheable=true)
   public static List<SObject> getSFObjectId(String field, String objectName, String mandatoryCondition, String filterCondition, String sortingCondition) {
       // Construct the dynamic SOQL query
       String queryString = ' SELECT ' + field + ' FROM ' + objectName;
       System.debug('Initial Query String: ' + queryString);
       if (mandatoryCondition != null && mandatoryCondition.trim() != '') {
           queryString += ' WHERE ' + mandatoryCondition;
       }
       if (filterCondition != null && filterCondition.trim() != '') {
        
            queryString += ' AND ' + filterCondition;
       }
        if (sortingCondition != null && sortingCondition.trim() != '') {
            queryString += ' ORDER BY ' + sortingCondition;
       }

       queryString += ' LIMIT 1 ';
       System.debug('Final Query String: ' + queryString);
       
       // Execute the query and return the Id of the first record
       List<SObject> result;
       try {
           result = Database.query(queryString);
           System.debug('result Id is ---->' + result);
       } catch (Exception e) {
           System.debug('Error executing query: ' + e.getMessage());
           throw e; // Optionally re-throw the exception if you want to propagate it further
       }
       return result;
   }

       @AuraEnabled(cacheable=true)
   public static List<SObject> getFieldValue(String field, String objectName, String condition) {
       // Construct the dynamic SOQL query
       String queryString = ' SELECT ' + field + ' FROM ' + objectName;
       System.debug('Initial Query String: ' + queryString);
       if (condition != null && condition.trim() != '') {
           queryString += ' WHERE ' + condition;
       }
       System.debug('Final Query String: ' + queryString);
       
       // Execute the query and return the Id of the first record
       List<SObject> result;
       try {
           result = Database.query(queryString);
           System.debug('result Id is ---->' + result);
       } catch (Exception e) {
           System.debug('Error executing query: ' + e.getMessage());
           throw e; // Optionally re-throw the exception if you want to propagate it further
       }
       return result;
   }
}