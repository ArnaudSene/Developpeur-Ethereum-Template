# Tests unitaires pour le smart contrat Voting

smart contrat disponible ici: [Voting](https://github.com/BenBktech/Promo-Buterin/blob/main/1.Solidity/Voting.sol)


## Installation

```shell
npm install
```


## Pré requis

Compiler le contrat pour s'assurer de sa validité et de la configuration du projet hardhat dont la version du compilateur.

```bash
npx hardhat compile
```

```
Downloading compiler 0.8.13
Compiled 3 Solidity files successfully
```


## Logique d'écriture des tests

1. Utilisation de hardhat pour les tests unitaires
2. Regroupement des tests par contexte
   1. Tests au déploiement du smart contrat
   2. Tests sur les modifiers onlyOwner et onlyVoters
   3. Tests en fonction du workflowStatus

## Exécuter les tests

Exécuter les tests

```bash
npx hardhat test
```

Exécuter les tests avec le coverage

```bash
npx hardhat coverage
```
