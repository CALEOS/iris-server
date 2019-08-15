FROM ubuntu:18.10

RUN apt update && apt install -y git g++ make cmake libboost-dev libboost-thread-dev libboost-test-dev  libboost-filesystem-dev libboost-date-time-dev libboost-system-dev libboost-iostreams-dev  libboost-program-options-dev libboost-locale-dev libssl-dev libgmp-dev build-essential

RUN git clone https://github.com/EOSChronicleProject/eos-chronicle.git

RUN cd eos-chronicle \
&& git submodule update --init --recursive \
&& mkdir build \
&& cd build \
&& cmake .. \
&& make

COPY config.ini /config.ini

CMD /eos-chronicle/build/chronicle-receiver --config-dir=/ --data-dir=/chronicle-data
