# Solidity TP

## Projet #1 - Système de vote

Un smart contract de vote peut être simple ou complexe, selon les exigences des élections que vous souhaitez soutenir. Le vote peut porter sur un petit nombre de propositions (ou de candidats) présélectionnées, ou sur un nombre potentiellement important de propositions suggérées de manière dynamique par les électeurs eux-mêmes.

Dans ce cadres, vous allez écrire un smart contract de vote pour une petite organisation. Les électeurs, que l'organisation connaît tous, sont inscrits sur une liste blanche (whitelist) grâce à leur adresse Ethereum, peuvent soumettre de nouvelles propositions lors d'une session d'enregistrement des propositions, et peuvent voter sur les propositions lors de la session de vote.

- Le vote n'est pas secret pour les utilisateurs ajoutés à la Whitelist 
- Chaque électeur peut voir les votes des autres
- Le gagnant est déterminé à la majorité simple
- La proposition qui obtient le plus de voix l'emporte.
- N'oubliez pas que votre code doit inspirer la confiance et faire en sorte de respecter les ordres déterminés!

### Le processus de vote:

Voici le déroulement de l'ensemble du processus de vote :

1. L'administrateur du vote enregistre une liste blanche d'électeurs identifiés par leur adresse Ethereum.
2. L'administrateur du vote commence la session d'enregistrement de la proposition.
3. Les électeurs inscrits sont autorisés à enregistrer leurs propositions pendant que la session d'enregistrement est active.
4. L'administrateur de vote met fin à la session d'enregistrement des propositions.
5. L'administrateur du vote commence la session de vote.
6. Les électeurs inscrits votent pour leur proposition préférée.
7. L'administrateur du vote met fin à la session de vote.
8. L'administrateur du vote comptabilise les votes.
9. Tout le monde peut vérifier les derniers détails de la proposition gagnante.

### Les recommandations et exigences:

1. Votre smart contract doit s’appeler “Voting”.
2. Votre smart contract doit utiliser la dernière version du compilateur.
3. L’administrateur est celui qui va déployer le smart contract.
4. Votre smart contract doit définir les structures de données suivantes :
```solidity
struct Voter {
    bool isRegistered;
    bool hasVoted;
    uint votedProposalId;
}

    struct Proposal {
    string description;
    uint voteCount;
}
```

5. Votre smart contract doit définir une énumération qui gère les différents états d’un vote
```solidity
enum WorkflowStatus {
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied
}
```

6. Votre smart contract doit définir un uint winningProposalId qui représente l’id du gagnant ou une fonction getWinner qui retourne le gagnant.
7. Votre smart contract doit importer le smart contract la librairie “Ownable” d’OpenZepplin.
8. Votre smart contract doit définir les événements suivants :

```solidity
event VoterRegistered(address voterAddress);
event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
event ProposalRegistered(uint proposalId);
event Voted (address voter, uint proposalId);
```

### Comment voter?

Il s'agit d'un workflow à sens unique. Chaque étape est limitante et aucun retour à l'étape précédente n'est permise.

- `admin` est L'administrateur
- `voter` est l'électeur
- `public` tout le monde

1. `admin` déploie le contrat
2. `admin` enregistre les électeurs qui participeront au processus
3. `admin` ouvre la session d'enregistrement des propositions
4. `voter` enregistrent leurs propositions
5. `admin` clôture la session d'enregistrement des propositions
6. `admin` ouvre la session des votes
7. `voter` vote pour une propositio
8. `admin` clôture la session des votes
9. `admin` Comptabilise les voix
10. `public` Lecture de la proposition gagnante

** `public` Lecture des propositions