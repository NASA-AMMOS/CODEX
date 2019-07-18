##
# ZMQ-based application apis
# @author Patrick Kage

import zmq
import msgpack
from termcolor import colored
from contextlib import redirect_stdout
from io import StringIO

# function decorator to expose methods
# use @expose('func name')
def expose(name, desc=None):
    def register_wrapper(func):
        func._ntangle = {
            "name": name,
            "desc": (desc if desc is not None else name)
        }
        return func
    return register_wrapper

# convert a connect uri to a bind uri
def convert_uri_to_bind(connect):
    return connect.replace('localhost', '*')

# logger class
class Logger:
    logging = False

    def __init__(self, logging=False):
        self.logging = logging

    def log(self, text, level="info"):
        if not self.logging:
            return
        level = level.lower()

        if level == 'error':
            level = colored('error', 'red')
        elif level == 'warn':
            level = colored('warn', 'yellow')
        else:
            level = colored('info', 'green')

        print( '[{}]: {}'.format(level, text) )

    def __call__(self, text, level="info"):
        self.log(text, level)
    def info(self, text):
        self.log(text, level="info")
    def error(self, text):
        self.log(text, level="error")
    def warn(self, text):
        self.log(text, level="warn")


# server class
class Server:
    module = ""
    methods = {}
    wrapped = None
    __context = None
    __socket = None
    __log = None
    __debug = False

    # construct the server
    def __init__(self, wrapped, context=None, logging=True, debug=True):
        # logging!
        self.__log = Logger(logging)

        # debug mode?
        self.__debug = debug

        # hang onto the wrapped class
        self.wrapped = wrapped

        # scan through fields looking for ntangled functions
        for field in dir(self.wrapped):
            # if we find a function that's been decorated
            if '_ntangle' in dir(getattr(self.wrapped, field)):
                # get the description off the object
                desc = getattr(self.wrapped, field)._ntangle
                # patch in the full method name
                desc['field'] = field
                self.methods[desc['name']] = desc

        self.__log('extracted descriptions')

        # set up the zmq context, re-using if we've got one
        if context is not None:
            self.__context = context
        else:
            self.__context = zmq.Context()

        # create the socket
        self.__socket = self.__context.socket(zmq.REP)
        self.__log('created socket')

    def __del__(self):
        # clean up the socket so we don't hang the program
        self.__socket.close()

    def __log(self, text, level="info"):
        if not self.__logging:
            return
        level = level.lower()

        if level == 'error':
            level = colored('error', 'red')
        elif level == 'warn':
            level = colored('warn', 'yellow')
        else:
            level = colored('info', 'green')

        print( '[{}]: {}'.format(level, text) )

    def call(self, name, args=[], kwargs={}):
        # retrieve the description of the call
        desc = self.methods[name]

        # create the output stream
        stdout = StringIO()

        # make the wrapped call
        with redirect_stdout(stdout):
            rv = getattr(self.wrapped, desc['field'])(*args, **kwargs)
        return rv, stdout.getvalue()

    def get_listing(self):
        desc = [{"name": key} for key in self.methods]
        return desc

    def listen(self, bind_addr):
        # bind the socket
        self.__socket.bind(bind_addr)
        self.__log('serving on {}'.format(bind_addr))

        shouldStop = False

        # listen for requests
        while not shouldStop:
            # wait for message
            message = self.__socket.recv_pyobj()

            # unpack the request
            reply = {'success': False}

            try:
                # check if the message is reserved, otherwise call the underlying object
                if message['func'] == '#listing':
                    self.__log('serving listing')
                    reply['return'] = self.get_listing()
                elif message['func'] == '#shutdown':
                    self.__log('shutting down the server', level='warn')
                    shouldStop = True
                    reply['return'] = True
                else:
                    self.__log('serving {}({}, {})'.format(
                        message['func'],
                        ', '.join([repr(a) for a in message['args']]),
                        ', '.join('{}={}'.format(k, repr(message['kwargs'][k])) for k in message['kwargs'])
                    ))

                    reply['return'], reply['stdout'] = self.call(message['func'], message['args'], message['kwargs'])
                reply['success'] = True
            except Exception as e:
                if not self.__debug:
                    reply['error'] = str(e)
                    self.__log('failed {}'.format(str(e)), level='error')
                else:
                    raise

            # pow! reply
            self.__socket.send_pyobj(reply)
