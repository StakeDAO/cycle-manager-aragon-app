/* global artifacts */
var CounterApp = artifacts.require('CycleManager.sol')

module.exports = function(deployer) {
  deployer.deploy(CounterApp)
}
