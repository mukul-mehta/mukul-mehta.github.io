const getRandomIPv4 = () => {
    const getRandomOctet = () => Math.floor(Math.random() * 256);
    return `${getRandomOctet()}.${getRandomOctet()}.${getRandomOctet()}.${getRandomOctet()}`;
};
  
function helloWorld() {
    return `Hello Hahahahahah something new - ${getRandomIPv4()}`
}
  
exports.default = helloWorld;
  