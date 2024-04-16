public class AccountDetailsController {
    @AuraEnabled(cacheable=true)
    public static Map<String, String> retrieveCurrentUserAccountDetails() {
        Map<String, String> accountDetails = new Map<String, String>();

        // Retrieve the currently logged-in user's information
        User currentUser;
        try {
            currentUser = [SELECT Id, AccountId, Account.Name, Account.Type, Email FROM User WHERE Id = :UserInfo.getUserId()];
            System.debug('Retrieved current user: ' + currentUser);
        } catch (Exception e) {
            System.debug('Error retrieving current user: ' + e.getMessage());
            // Add error handling if needed
            return accountDetails; // Return an empty map if an error occurs
        }

        // Check if the user is associated with an account
        if(currentUser.Id != null) {
            // Set the current user's account details
            accountDetails.put('AccountId', currentUser.Id);
            accountDetails.put('Email', currentUser.Email);

            System.debug('Email: ' + currentUser.Email);
        } else {
            System.debug('No user present!!');
        }

        System.debug('account details' + accountDetails);

        return accountDetails;
    }
}
