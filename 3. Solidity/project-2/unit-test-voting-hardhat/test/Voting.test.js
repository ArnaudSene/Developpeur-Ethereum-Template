const { expect } = require("chai");
const { ethers} = require("hardhat");
const {BigNumber} = require("ethers");


describe("Voting", () => {

    context("At deployment", () => {
        let votingInstance;

        beforeEach(async () => {
            const Voting = await ethers.getContractFactory("Voting");
            votingInstance = await Voting.deploy();
        });

        it("should have 0 winning proposal.", async () => {
            const result = await votingInstance.winningProposalID();
            expect(result).to.be.equal(BigNumber.from("0"));
        });

        it("should get RegisteringVoters (index=0) as default WorkflowStatus.", async () => {
            const result = await votingInstance.workflowStatus();
            expect(result).to.be.equal(BigNumber.from("0"));
        });
    });

    context("non-registered voters", () => {
        let votingInstance, owner, other;

        beforeEach(async () => {
            const Voting = await ethers.getContractFactory("Voting");
            [owner, other] = await ethers.getSigners();
            votingInstance = await Voting.connect(owner).deploy();
        });

        it("prevent from getting voters.", async () => {
            await expect(votingInstance.getVoter(other.address))
                .to.be.revertedWith("You're not a voter");
        });

        it("prevent from getting proposals.", async () => {
            await expect(votingInstance.getOneProposal(123))
                .to.be.revertedWith("You're not a voter");
        });

        it("prevent from adding proposals.", async () => {
            await expect(votingInstance.connect(other).addProposal("fake proposal"))
                .to.be.revertedWith("You're not a voter");
        });

        it("prevent from setting votes.", async () => {
            await expect(votingInstance.connect(other).setVote(0))
                .to.be.revertedWith("You're not a voter");
        });

    });

    context("non-owners", () => {
        let votingInstance, owner, other;

        beforeEach(async () => {
            const Voting = await ethers.getContractFactory("Voting");
            [owner, other] = await ethers.getSigners();
            votingInstance = await Voting.connect(owner).deploy();
        });

        it("prevent from adding voters.", async () => {
            await expect(votingInstance.connect(other).addVoter(other.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("prevent from starting proposal registration.", async () => {
            await expect(votingInstance.connect(other).startProposalsRegistering())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("prevent from ending proposal registration.", async () => {
            await expect(votingInstance.connect(other).endProposalsRegistering())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("prevent from starting vote session.", async () => {
            await expect(votingInstance.connect(other).startVotingSession())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("prevent from ending vote session.", async () => {
            await expect(votingInstance.connect(other).endVotingSession())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("prevent from tally votes.", async () => {
            await expect(votingInstance.connect(other).tallyVotes())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

    });

    context("With workflowStatus = RegisteringVoters", () => {
        let votingInstance, owner, other;

        beforeEach(async () => {
            const Voting = await ethers.getContractFactory("Voting");
            [owner, other] = await ethers.getSigners();
            votingInstance = await Voting.deploy();
        });

        it("prevent from computing tally votes with incorrect workflowStatus.", async () => {
            await expect(votingInstance.tallyVotes())
                .to.be.revertedWith("Current status is not voting session ended");
        });

        it("owner can start proposal registration and emit an event.", async () => {
            await expect(votingInstance.startProposalsRegistering())
                .to.emit(votingInstance, "WorkflowStatusChange").withArgs(
                    BigNumber.from("0"), BigNumber.from("1"));
        });

        it("owner can add voters and emit an event.", async () => {
            await expect(votingInstance.addVoter(other.address))
                .to.emit(votingInstance, "VoterRegistered").withArgs(other.address);
        });

        it("prevent from adding an existing registered voter.", async () => {
            await votingInstance.addVoter(other.address);
            await expect(votingInstance.addVoter(other.address))
                .to.be.revertedWith("Already registered");
        });

    });

    context("With workflowStatus = ProposalsRegistrationStarted", () => {
        let votingInstance, owner, other;

        beforeEach(async () => {
            const Voting = await ethers.getContractFactory("Voting");
            [owner, other] = await ethers.getSigners();
            votingInstance = await Voting.connect(owner).deploy();
            await votingInstance.addVoter(other.address);
            await votingInstance.startProposalsRegistering();
        });

        it("prevent from starting registration with incorrect workflowStatus.", async () => {
            await expect(votingInstance.startProposalsRegistering())
                .to.be.revertedWith("Registering proposals cant be started now");
        });

        it("prevent from adding voter.", async () => {
            await expect(votingInstance.addVoter(other.address))
                .to.be.revertedWith("Voters registration is not open yet");
        });

        it("registered voter can add proposals.", async () => {
            await expect(votingInstance.connect(other).addProposal("fake proposal"))
                .to.emit(votingInstance, "ProposalRegistered")
                .withArgs(BigNumber.from("1"));
        });

        it("prevent from adding an empty proposal.", async () => {
            await expect(votingInstance.connect(other).addProposal(""))
                .to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
        });

        it("owner can stop proposal registration and emit an event.", async () => {
            await expect(votingInstance.endProposalsRegistering())
                .to.emit(votingInstance, "WorkflowStatusChange").withArgs(
                    BigNumber.from("1"), BigNumber.from("2"));
        });

    });

    context("With workflowStatus = ProposalsRegistrationEnded", () => {
        let votingInstance, owner, voter;

        beforeEach(async () => {
            const Voting = await ethers.getContractFactory("Voting");
            [owner, voter] = await ethers.getSigners();
            votingInstance = await Voting.connect(owner).deploy();
            await votingInstance.addVoter(voter.address);
            await votingInstance.startProposalsRegistering();
            await votingInstance.endProposalsRegistering();
        });

        it("prevent from stopping registration with incorrect workflowStatus.", async () => {
            await expect(votingInstance.endProposalsRegistering())
                .to.be.revertedWith("Registering proposals havent started yet");
        });

        it("prevent from adding proposal.", async () => {
            await expect(votingInstance.connect(voter).addProposal("fake proposal"))
                .to.be.revertedWith("Proposals are not allowed yet");
        });

        it("owner can start vote session and emit an event.", async () => {
            await expect(votingInstance.startVotingSession())
                .to.emit(votingInstance, "WorkflowStatusChange").withArgs(
                    BigNumber.from("2"), BigNumber.from("3"));
        });
    });

    context("With workflowStatus = VotingSessionStarted", () => {
        let votingInstance, owner, other;

        beforeEach(async () => {
            const Voting = await ethers.getContractFactory("Voting");
            [owner, other] = await ethers.getSigners();
            votingInstance = await Voting.connect(owner).deploy();
            await votingInstance.addVoter(other.address);
            await votingInstance.startProposalsRegistering();
            await votingInstance.connect(other).addProposal("fake proposal")
            await votingInstance.endProposalsRegistering();
            await votingInstance.startVotingSession();
        });

        it("prevent from starting registration with incorrect workflowStatus.", async () => {
            await expect(votingInstance.startVotingSession())
                .to.be.revertedWith("Registering proposals phase is not finished");
        });


        it("registered voter can vote for proposals.", async () => {
            await expect(votingInstance.connect(other).setVote(BigNumber.from("0")))
                .to.emit(votingInstance, "Voted")
                .withArgs(other.address, BigNumber.from("0"));
        });

        it("prevent registered voter from voting twice.", async () => {
            await votingInstance.connect(other).setVote(BigNumber.from("0"));
            await expect(votingInstance.connect(other).setVote(BigNumber.from("0")))
                .to.be.revertedWith("You have already voted");
        });

        it("prevent registered voter from voting invalid proposal.", async () => {
            await expect(votingInstance.connect(other).setVote(BigNumber.from("999")))
                .to.be.revertedWith("Proposal not found");
        });

        it("owner can stop vote session.", async () => {
            await expect(votingInstance.endVotingSession())
                .to.emit(votingInstance, "WorkflowStatusChange")
                .withArgs(BigNumber.from("3"), BigNumber.from("4"));
        });
    });

    context("With workflowStatus = VotingSessionEnded", () => {
        let votingInstance, owner, voter1, voter2;

        beforeEach(async () => {
            const Voting = await ethers.getContractFactory("Voting");
            [owner, voter1, voter2] = await ethers.getSigners();
            votingInstance = await Voting.connect(owner).deploy();
            await votingInstance.addVoter(voter1.address);
            await votingInstance.addVoter(voter2.address);
            await votingInstance.startProposalsRegistering();
            await votingInstance.connect(voter1).addProposal("fake proposal")
            await votingInstance.connect(voter2).addProposal("fake proposal 2")
            await votingInstance.endProposalsRegistering();
            await votingInstance.startVotingSession();
            await votingInstance.connect(voter1).setVote(BigNumber.from("1"));
            await votingInstance.endVotingSession();
        });

        it("prevent from stopping vote session with incorrect workflowStatus.", async () => {
            await expect(votingInstance.endVotingSession())
                .to.be.revertedWith("Voting session havent started yet");
        });

        it("prevent from voting.", async () => {
            await expect(votingInstance.connect(voter1).setVote(BigNumber.from("1")))
                .to.be.revertedWith("Voting session havent started yet");
        });

        it("owner can compute tally votes and emit an event.", async () => {
            await expect(votingInstance.tallyVotes())
                .to.emit(votingInstance, "WorkflowStatusChange").withArgs(
                    BigNumber.from("4"), BigNumber.from("5"));
        });

        it("registered voter can get voter information, has voted", async () => {
            const voter = await votingInstance.connect(voter1).getVoter(voter1.address);
            expect(voter.isRegistered).to.be.true;
            expect(voter.hasVoted).to.be.true;
            expect(voter.votedProposalId).to.be.equal(BigNumber.from("1"));
        });

        it("registered voter can get voter information, has not voted", async () => {
            const voter = await votingInstance.connect(voter1).getVoter(voter2.address);
            expect(voter.isRegistered).to.be.true;
            expect(voter.hasVoted).to.be.false;
            expect(voter.votedProposalId).to.be.equal(BigNumber.from("0"));
        });

        it("registered voter can get a proposal", async () => {
            const proposal0 = await votingInstance.connect(voter1).getOneProposal(BigNumber.from("0"));
            const proposal1 = await votingInstance.connect(voter1).getOneProposal(BigNumber.from("1"));
            const proposal2 = await votingInstance.connect(voter1).getOneProposal(BigNumber.from("2"));

            expect(proposal0.description).to.be.equal("GENESIS");
            expect(proposal0.voteCount).to.be.equal(BigNumber.from("0"));

            expect(proposal1.description).to.be.equal("fake proposal");
            expect(proposal1.voteCount).to.be.equal(BigNumber.from("1"));

            expect(proposal2.description).to.be.equal("fake proposal 2");
            expect(proposal2.voteCount).to.be.equal(BigNumber.from("0"));

        });

    });

});