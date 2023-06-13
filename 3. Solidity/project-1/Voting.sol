// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title A voting system
 * @author Arnaud Sene
 * @notice This contract is only for exercise
 */
contract Voting is Ownable {

    /// @dev A structure that define a voter
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    /// @dev A structure that de fine a proposal
    struct Proposal {
        string description;
        uint voteCount;
    }

    /// @dev A Enum of workflow status during the votation process
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @dev stores voters by addresses
    mapping(address => Voter) private _voters;

    /// @dev stores proposal struct, description and winner
    Proposal[] private _proposals;
    mapping(string => bool) private _proposalDescriptions;
    uint256 winningProposalId;

    /// @dev This represent the Workflow status at runtime
    WorkflowStatus private _workflowStatus;

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);
    event ProposalsRegistered(uint proposalId, string description);

    /// @dev Voters must be registered
    modifier onlyRegisteredVoters(address _voter) {
        require(_voters[_voter].isRegistered, "Restricted to registered voters!");
        _;
    }

    /// @dev Update workflow status
    function _updateWorkflowStatus(WorkflowStatus previousStatus, WorkflowStatus newStatus) private {
        _workflowStatus = newStatus;
        emit WorkflowStatusChange(previousStatus, newStatus);
    }

    /**
     * @notice Register voters who can participate in the proposal and voting session.
     * @dev Restricted to Admin (Owner)
     */
    function registerVoter(address voterAddress) external onlyOwner {
        /// @dev Status must be RegisteringVoters
        require(_workflowStatus == WorkflowStatus.RegisteringVoters, "Register voter session closed!");

        /// @dev Voter cannot be registered twice
        require(_voters[voterAddress].isRegistered == false, "Voter already registered!");

        _voters[voterAddress].isRegistered = true;
        emit VoterRegistered(voterAddress);
    }

    /**
     * @notice Start a proposal session so that registered voters can add proposals
     * @dev Restricted to Admin (Owner)
     */
    function startProposalRegistration() external onlyOwner {
        /// @dev Cannot start twice
        require(_workflowStatus != WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration is already started!");

        /// @dev Workflow status must be RegisteringVoters
        require(_workflowStatus == WorkflowStatus.RegisteringVoters, "Starting proposal registration is not allowed!");

        _updateWorkflowStatus(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /**
     * @notice Close a proposal session so that registered voters cannot add proposals anymore
     * @dev Restricted to Admin (Owner)
     */
    function closeProposalRegistration() external onlyOwner {
        /// @dev Cannot close twice
        require(_workflowStatus != WorkflowStatus.ProposalsRegistrationEnded, "Proposal registration is already closed!");

        /// @dev Workflow status must be ProposalsRegistrationStarted
        require(_workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Closing proposal registration is not allowed!");

        _updateWorkflowStatus(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /**
     * @notice Start a voting session so that registered voters can select a proposal
     * @dev Restricted to Admin (Owner)
     */
    function startVotingSession() external onlyOwner {
        /// @dev Cannot start twice
        require(_workflowStatus != WorkflowStatus.VotingSessionStarted, "Voting session is already started!");

        /// @dev Workflow status must be ProposalsRegistrationEnded
        require(_workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, "Starting vote session is not allowed!");

        _updateWorkflowStatus(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /**
     * @notice Close a voting session so that registered voters cannot select a proposal anymore
     * @dev Restricted to Admin (Owner)
     */
    function closeVotingSession() external onlyOwner {
        /// @dev Cannot close twice
        require(_workflowStatus != WorkflowStatus.VotingSessionEnded, "Voting session is already closed!");

        /// @dev Workflow status must be VotingSessionStarted
        require(_workflowStatus == WorkflowStatus.VotingSessionStarted, "Closing vote session is not allowed!");

        _updateWorkflowStatus(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /**
     * @notice Allow registered voters to save proposals
     * This is allowed during proposal registration session
     * @dev Restricted to registered voters
     */
    function registerProposal(string memory description) external onlyRegisteredVoters(msg.sender) {
        /// @dev Registration proposal session must be started
        require(_workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration not started!");

        /// @dev No duplicate proposals
        if (_proposalDescriptions[description] == true)
            revert("Proposal is already registered!");

        _proposals.push(
            Proposal({
                description: description,
                voteCount: 0
            })
        );

        _proposalDescriptions[description] = true;
        emit ProposalRegistered(_proposals.length - 1);
    }

    /**
     * @notice Allow registered voters to vote for a proposal
     * This is allowed during voting session
     * @dev Restricted to registered voters
     */
    function voteProposal(uint proposalId) external onlyRegisteredVoters(msg.sender) {
        /// @dev Vote session must be started
        require(_workflowStatus == WorkflowStatus.VotingSessionStarted, "Vote session not started!");

        /// @dev Vote once
        require(_voters[msg.sender].hasVoted == false, "Already cast ballots!");

        /// @dev Proposal must exist
        require(proposalId < _proposals.length, "Proposal does not exist!");

        _voters[msg.sender].hasVoted = true;
        _voters[msg.sender].votedProposalId = proposalId;
        _proposals[proposalId].voteCount++;
        emit Voted (msg.sender, proposalId);
    }

    /**
     * @notice Counting of votes and extract the winner
     * Winner is elected by simple majority
     * In the event of a tie, the first proposal is elected
     * This is allowed once voting session is closed
     * @dev Restricted to Admin (owner)
     */
    function countOfVotes() external onlyOwner {
        /// @dev Vote session must be closed
        require(_workflowStatus == WorkflowStatus.VotingSessionEnded, "Vote session not closed!");

        Proposal memory proposalWithHighestScore;

        for (uint i = 0; i < _proposals.length; i++ ) {
            if (_proposals[i].voteCount > proposalWithHighestScore.voteCount) {
                proposalWithHighestScore = _proposals[i];
                winningProposalId = i;
            }
        }

        _updateWorkflowStatus(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }

    /**
     * @notice Read registered proposals
     * @dev All audience
     */
    function readProposals() external {
        for (uint i = 0; i < _proposals.length; i++)
            emit ProposalsRegistered(i, _proposals[i].description);
    }

    /**
     * @notice Get the winning proposal
     * @dev All audience
     * @return the proposal as a struct
     */
    function getWinner() external view returns (Proposal memory) {
        if (_proposals.length == 0 || _workflowStatus != WorkflowStatus.VotesTallied)
            revert("No results!");

        return _proposals[winningProposalId];
    }
}
