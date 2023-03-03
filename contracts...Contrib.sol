// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Define a contract for open source project contributions
contract OpenSourceProject {

    struct Review {
        address reviewer;
        bool accept;
    }

    address public developer; // The address of the developer who made the contribution
    string public description; // A brief description of the contribution
    bool public finished; // A boolean flag indicating whether the contribution's review deadline is due
    bool public accepted; // A boolean flag indicating whether the contribution was accepted by reviewers or not
    uint256 public threshold; // The number of reviews required for this contribution
    uint256 public reviewsCount; // The number of reviews from reviewers for this contribution
    int256 public score; // The current score of this contribution
    
    Review[] public reviews;

    constructor(string memory _description) {
        developer = msg.sender;
        description = _description;
        finished = accepted = false;
        threshold = 1;
        reviewsCount = 0;
        score = 0;
    }

    // Define an event for logging reviews from reviewers
    event Reviewed(address indexed reviewer, bool accept);

    // Define a modifier that checks if the caller is a registered user on NuvoOne platform
    // modifier onlyNuvoUser() {
    //     require(NuvoOne.isUser(msg.sender), "Caller is not a registered user on NuvoOne platform");
    //     _;
    // }

    // Define a modifier that checks if the caller has enough reputation score on NuvoOne platform to be a reviewer
    // modifier onlyNuvoReviewer() {
    //     require(NuvoOne.getReputationScore(msg.sender) >= 1000, "Caller does not have enough reputation score on NuvoOne platform to be a reviewer");
    //     _;
    // }

    // Define a function that allows reviewers to review on contribution
    function review(bool _accept) public /*onlyNuvoReviewer*/ {
        // Check if the contribution exists
        require(developer != address(0), "Contribution does not exist");

        // Check if the contribution has not been finished yet
        require(!finished, "Contribution has already finished");

        // Flag for if the reviewer reviewed before
        bool reviewed = false;
        for(uint i = 0; !reviewed && i < reviews.length; i++) {
            if(reviews[i].reviewer == msg.sender) reviewed = true;
        }
        require(!reviewed, "Contribution has already been voted to by you");

        Review memory newReview = Review({
            reviewer: msg.sender,
            accept: _accept
        });

        reviews.push(newReview);

        // Increment the number of reviews for the contribution
        reviewsCount++;

        if(_accept) {
            score++;
        } else {
            score--;
        }

        // Emit an event to log the vote from the reviewer
        emit Reviewed(msg.sender, _accept);

        // Check if the contribution has reached the threshold of reviews
        if (reviewsCount == threshold) {

            // Write its acceptance state
            if(score > 0) {
                // Mark the contribution as accepted
                accepted = true;
            } else {
                // Mark the contribution as rejected
                accepted = false;
            }

            // Mark as finished
            finished = true;

            // Reward the developer with reputation points on NuvoOne platform
            if(accepted) {
                // NuvoOne.increaseReputationScore(contributions[_id].developer, 100);
            }

            // Reward the each reviewer with reputation points on NuvoOne platform
            for (uint i = 0; i < reviews.length; i++) {
                // Reward each reviewer if they gave a review matching the majority
                if(reviews[i].accept == accepted) {
                    // NuvoOne.increaseReputationScore(contributions[_id].reviews[i].reviewer, 10);
                }
            }
        }
    }
}