import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import data from '../../assets/data/preguntas.json';

export default function PregunterosScreen() {
  const [respuestaUsuario, setRespuestaUsuario] = useState<string | null>(null);
  const [resultado, setResultado] = useState<'correcto' | 'incorrecto' | null>(null);
  const [indexPregunta, setIndexPregunta] = useState(0);
  const actual = data[indexPregunta];

  const siguientePregunta = () => {
    setRespuestaUsuario(null);
    setResultado(null);
    setIndexPregunta((prev) => (prev + 1) % data.length);
  };

  const verificarRespuesta = (respuesta: string) => {
    setRespuestaUsuario(respuesta);
    const esCorrecta =
      actual.tipo === 'texto'
        ? respuesta.trim().toLowerCase() === actual.correcta.toLowerCase()
        : respuesta === actual.correcta;

    setResultado(esCorrecta ? 'correcto' : 'incorrecto');
  };

  const renderResultado = () => {
    if (!resultado) return null;
    return (
      <View style={styles.resultado}>
        <Text style={{ color: resultado === 'correcto' ? '#34d399' : '#ff6b6b', fontSize: 18 }}>
          {resultado === 'correcto' ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}
        </Text>
        <TouchableOpacity style={[styles.boton, { marginTop: 20 }]} onPress={siguientePregunta}>
          <Text style={styles.textoBoton}>Siguiente pregunta</Text>
        </TouchableOpacity>
      </View>
    );
  };



  const renderRespuesta = () => {
    switch (actual.tipo) {
      case 'multiple':
        return (
          <View style={styles.bloque}>
           {actual.opciones?.map((op, i) => (
            
            <TouchableOpacity key={i} style={styles.boton} onPress={() => verificarRespuesta(op)}>
                <Text style={styles.textoBoton}>{op}</Text>
            </TouchableOpacity>
))}

          </View>
        );
      case 'texto':
        return (
          <>
            <TextInput
              placeholder="Escribí tu respuesta..."
              placeholderTextColor="#aaa"
              style={styles.input}
              onChangeText={setRespuestaUsuario}
              value={respuestaUsuario ?? ''}
            />
            <TouchableOpacity style={styles.boton} onPress={() => verificarRespuesta(respuestaUsuario ?? '')}>
              <Text style={styles.textoBoton}>Enviar</Text>
            </TouchableOpacity>
          </>
        );
      case 'vf':
        return (
          <View style={styles.bloque}>
            <TouchableOpacity style={styles.boton} onPress={() => verificarRespuesta('Verdadero')}>
              <Text style={styles.textoBoton}>Verdadero</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.boton} onPress={() => verificarRespuesta('Falso')}>
              <Text style={styles.textoBoton}>Falso</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.pregunta}>
       <Text style={styles.titulo}>{actual.pregunta}</Text>

      </View>
      <View style={styles.respuesta}>
        {renderRespuesta()}
        {renderResultado()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  pregunta: {
    flex: 1,
    marginBottom: 24,
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 12,
  },
  titulo: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  respuesta: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloque: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  boton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
  },
  resultado: {
    marginTop: 20,
  },
});
